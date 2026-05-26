export function parseTokenList(raw) {
  return String(raw || "")
    .split(/[\n,]/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function tokenFromRequest(req) {
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const headerToken = req.headers["x-bartleby-token"];
  if (Array.isArray(headerToken)) return headerToken[0]?.trim() || "";
  return String(headerToken || "").trim();
}

export function createAuthenticator(tokens) {
  const allowed = new Set(tokens.filter(Boolean));
  return function authenticate(req) {
    if (allowed.size === 0) {
      return { ok: false, status: 503, message: "relay auth is not configured" };
    }
    const token = tokenFromRequest(req);
    if (!token || !allowed.has(token)) {
      return { ok: false, status: 401, message: "unauthorized" };
    }
    return { ok: true };
  };
}
