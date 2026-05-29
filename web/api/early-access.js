import { neon } from "@neondatabase/serverless";
import { PostHog } from "posthog-node";

// POST /api/early-access — called on every app launch with {machineIdHash, appVersion}.
// First call INSERTs (new install), later calls UPDATE last_seen_at (heartbeat).
// neon is the source of truth for who has used Bartleby (early-adopter identity for
// future licensing — NOT a free-forever grant; granted_at is just first-seen).
// PostHog mirrors ONLY new installs (app_installed); per-launch heartbeat is already
// covered by the client app_opened event, so we don't double-emit here.
//
// Privacy: only an anonymous SHA256 machine id + app version. No meeting content.

let _sql = null;
function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    _sql = neon(url);
  }
  return _sql;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "invalid_json" }); }
  }
  body = body || {};

  const machineIdHash = typeof body.machineIdHash === "string" ? body.machineIdHash.trim() : "";
  const appVersion = typeof body.appVersion === "string" ? body.appVersion.trim() : null;

  // SHA256 hex is 64 chars — light sanity check.
  if (machineIdHash.length < 16 || machineIdHash.length > 128) {
    return res.status(400).json({ error: "invalid_machine_id" });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      INSERT INTO early_access (machine_id_hash, app_version, last_seen_at)
      VALUES (${machineIdHash}, ${appVersion}, now())
      ON CONFLICT (machine_id_hash)
      DO UPDATE SET last_seen_at = now(),
                    app_version = COALESCE(EXCLUDED.app_version, early_access.app_version)
      RETURNING granted_at, (xmax = 0) AS inserted
    `;
    const grantedAt = rows[0]?.granted_at ?? new Date().toISOString();
    const inserted = rows[0]?.inserted ?? false;

    // Mirror new installs to PostHog (best-effort; never blocks the response).
    const phKey = process.env.POSTHOG_KEY;
    if (inserted && phKey) {
      const ph = new PostHog(phKey, { host: "https://us.i.posthog.com", flushAt: 1, flushInterval: 0 });
      ph.capture({
        distinctId: machineIdHash,
        event: "app_installed",
        properties: { app_version: appVersion ?? undefined },
      });
      ph.shutdown().catch((e) => console.error("[early-access] posthog error", e));
    }

    return res.status(200).json({ ok: true, grantedAt });
  } catch (err) {
    console.error("[early-access] db error", err);
    return res.status(500).json({ error: "db_error" });
  }
}
