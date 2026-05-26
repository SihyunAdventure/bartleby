import WebSocket from "ws";

export const SONIOX_WS_URL = "wss://stt-rt.soniox.com/transcribe-websocket";

const DEFAULT_CONFIG = Object.freeze({
  model: "stt-rt-v4",
  audio_format: "pcm_s16le",
  sample_rate: 16000,
  num_channels: 1,
  language_hints: ["en", "ko"],
  enable_endpoint_detection: true,
  enable_language_identification: true,
});

export function buildSonioxConfig(clientConfig = {}, apiKey) {
  if (!apiKey) throw new Error("SONIOX_API_KEY is not configured");
  const safe = typeof clientConfig === "object" && clientConfig !== null ? clientConfig : {};
  return {
    ...safe,
    ...DEFAULT_CONFIG,
    api_key: apiKey,
  };
}

export function isJsonConfigMessage(data, isBinary) {
  if (isBinary) return false;
  const text = data.toString("utf8").trim();
  return text.startsWith("{") && text.endsWith("}");
}

export function messageByteLength(data) {
  if (Buffer.isBuffer(data)) return data.length;
  if (data instanceof ArrayBuffer) return data.byteLength;
  if (Array.isArray(data)) return data.reduce((sum, chunk) => sum + messageByteLength(chunk), 0);
  return Buffer.byteLength(String(data));
}

export function safeCloseCode(code, fallback = 1011) {
  const n = Number(code);
  if (!Number.isInteger(n)) return fallback;
  // 1005, 1006, and 1015 are reserved and must not be sent in close frames.
  if (n < 1000 || n > 4999 || n === 1005 || n === 1006 || n === 1015) return fallback;
  return n;
}

export function proxySonioxSession({ client, config, log, sessionId, onClose }) {
  const upstream = new WebSocket(SONIOX_WS_URL, {
    perMessageDeflate: false,
    handshakeTimeout: 10_000,
  });

  let upstreamOpen = false;
  let configSent = false;
  let clientBytes = 0;
  let upstreamBytes = 0;
  const queued = [];
  const startedAt = Date.now();

  function closeBoth(code = 1000, reason = "closed") {
    const reasonText = String(reason).slice(0, 120);
    if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
      client.close(code, reasonText);
    }
    if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
      upstream.close();
    }
  }

  const durationTimer = setTimeout(() => {
    log("stt_session_limit", { sessionId, maxSeconds: config.maxSttSessionSeconds });
    closeBoth(4008, "session time limit");
  }, config.maxSttSessionSeconds * 1000);
  durationTimer.unref?.();

  function sendDefaultConfig() {
    if (configSent) return;
    upstream.send(JSON.stringify(buildSonioxConfig({}, config.sonioxApiKey)));
    configSent = true;
  }

  function forwardClientMessage(data, isBinary) {
    if (!upstreamOpen) {
      queued.push([data, isBinary]);
      return;
    }

    if (!configSent) {
      if (isJsonConfigMessage(data, isBinary)) {
        let parsed;
        try {
          parsed = JSON.parse(data.toString("utf8"));
        } catch {
          closeBoth(1003, "invalid Soniox config JSON");
          return;
        }
        upstream.send(JSON.stringify(buildSonioxConfig(parsed, config.sonioxApiKey)));
        configSent = true;
        return;
      }
      sendDefaultConfig();
    }

    upstream.send(data, { binary: isBinary });
  }

  upstream.on("open", () => {
    upstreamOpen = true;
    log("stt_upstream_open", { sessionId });
    while (queued.length) {
      const [data, isBinary] = queued.shift();
      forwardClientMessage(data, isBinary);
    }
  });

  upstream.on("message", (data, isBinary) => {
    upstreamBytes += messageByteLength(data);
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, { binary: isBinary });
    }
  });

  upstream.on("error", (error) => {
    log("stt_upstream_error", { sessionId, message: error.message });
    closeBoth(1011, "upstream error");
  });

  upstream.on("close", (code, reason) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(safeCloseCode(code), reason?.toString()?.slice(0, 120) || "upstream closed");
    }
  });

  client.on("message", (data, isBinary) => {
    clientBytes += messageByteLength(data);
    if (clientBytes > config.maxWsBytes) {
      log("stt_byte_limit", { sessionId, clientBytes, maxBytes: config.maxWsBytes });
      closeBoth(4009, "session byte limit");
      return;
    }
    forwardClientMessage(data, isBinary);
  });

  client.on("error", (error) => {
    log("stt_client_error", { sessionId, message: error.message });
    closeBoth(1011, "client error");
  });

  client.on("close", () => {
    clearTimeout(durationTimer);
    if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
      upstream.close();
    }
    log("stt_session_closed", {
      sessionId,
      durationMs: Date.now() - startedAt,
      clientBytes,
      upstreamBytes,
    });
    onClose?.();
  });
}
