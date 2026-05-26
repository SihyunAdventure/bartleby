import { parseTokenList } from "./auth.js";

function intEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env = process.env) {
  const betaTokens = [
    ...parseTokenList(env.BARTLEBY_RELAY_TOKENS),
    ...parseTokenList(env.BETA_TOKENS),
    ...parseTokenList(env.BETA_TOKEN),
  ];
  return {
    host: env.HOST || "0.0.0.0",
    port: intEnv("PORT", 8787),
    disabled: env.RELAY_DISABLED === "1" || env.RELAY_DISABLED === "true",
    sonioxApiKey: env.SONIOX_API_KEY || "",
    upstageApiKey: env.UPSTAGE_API_KEY || "",
    betaTokens,
    maxConcurrentSessions: intEnv("MAX_CONCURRENT_SESSIONS", 4),
    maxSttSessionSeconds: intEnv("MAX_STT_SESSION_SECONDS", 7200),
    maxWsBytes: intEnv("MAX_WS_BYTES", 1024 * 1024 * 1024),
  };
}
