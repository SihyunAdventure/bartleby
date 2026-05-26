#!/usr/bin/env node
import http from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";
import { createAuthenticator } from "./auth.js";
import { loadConfig } from "./config.js";
import { json, methodNotAllowed, readJson } from "./http.js";
import { proxySonioxSession } from "./soniox.js";
import { streamTranslation, summarize, translate } from "./upstage.js";

const config = loadConfig();
const authenticate = createAuthenticator(config.betaTokens);
let activeSessions = 0;

function log(event, fields = {}) {
  const line = {
    ts: new Date().toISOString(),
    event,
    ...fields,
  };
  console.log(JSON.stringify(line));
}

function requireReady(res) {
  if (config.disabled) {
    json(res, 503, { error: "relay_disabled" });
    return false;
  }
  return true;
}

async function route(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, {
      ok: true,
      service: "bartleby-relay",
      disabled: config.disabled,
      activeSessions,
      maxConcurrentSessions: config.maxConcurrentSessions,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/v1/health") {
    json(res, 200, { ok: true, service: "bartleby-relay" });
    return;
  }

  if (!requireReady(res)) return;

  const auth = authenticate(req);
  if (!auth.ok) {
    json(res, auth.status, { error: auth.message });
    return;
  }

  try {
    if (url.pathname === "/v1/auth/check") {
      if (req.method !== "GET") return methodNotAllowed(res);
      json(res, 200, { ok: true, service: "bartleby-relay" });
      return;
    }

    if (url.pathname === "/v1/summary/finalize") {
      if (req.method !== "POST") return methodNotAllowed(res);
      const body = await readJson(req, 2 * 1024 * 1024);
      const result = await summarize(config.upstageApiKey, body);
      json(res, 200, result);
      return;
    }

    if (url.pathname === "/v1/translate") {
      if (req.method !== "POST") return methodNotAllowed(res);
      const body = await readJson(req, 256 * 1024);
      if (url.searchParams.get("stream") === "1" || url.searchParams.get("stream") === "true") {
        await streamTranslation(config.upstageApiKey, body, res);
        return;
      }
      const result = await translate(config.upstageApiKey, body);
      json(res, 200, result);
      return;
    }

    json(res, 404, { error: "not_found" });
  } catch (error) {
    log("http_error", {
      path: url.pathname,
      status: error.status || 500,
      message: error.message,
    });
    json(res, error.status || 500, {
      error: error.status && error.status < 500 ? error.message : "internal_error",
    });
  }
}

const server = http.createServer(route);
const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname !== "/v1/stt/realtime") {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }
  if (config.disabled) {
    socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
    socket.destroy();
    return;
  }
  const auth = authenticate(req);
  if (!auth.ok) {
    socket.write(`HTTP/1.1 ${auth.status} Unauthorized\r\n\r\n`);
    socket.destroy();
    return;
  }
  if (!config.sonioxApiKey) {
    socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
    socket.destroy();
    return;
  }
  if (activeSessions >= config.maxConcurrentSessions) {
    socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (client, req) => {
  activeSessions += 1;
  const sessionId = randomUUID();
  log("stt_session_open", {
    sessionId,
    activeSessions,
    remote: req.socket.remoteAddress,
  });
  proxySonioxSession({
    client,
    config,
    log,
    sessionId,
    onClose: () => {
      activeSessions = Math.max(0, activeSessions - 1);
    },
  });
});

server.listen(config.port, config.host, () => {
  log("relay_listening", {
    host: config.host,
    port: config.port,
    disabled: config.disabled,
    maxConcurrentSessions: config.maxConcurrentSessions,
  });
});

function shutdown(signal) {
  log("relay_shutdown", { signal });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
