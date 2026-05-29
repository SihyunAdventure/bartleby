import { neon } from "@neondatabase/serverless";

// POST /api/usage — called after each finished recording with
// {machineIdHash, durationSec, appVersion}. Aggregates per-machine recording
// counts and EXACT total seconds (more useful than PostHog's duration buckets
// for future pricing/cost modeling). Numbers only — never meeting content.

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
  let durationSec = Number(body.durationSec);
  if (!Number.isFinite(durationSec) || durationSec < 0) durationSec = 0;
  durationSec = Math.min(Math.floor(durationSec), 24 * 60 * 60); // clamp to <= 1 day

  if (machineIdHash.length < 16 || machineIdHash.length > 128) {
    return res.status(400).json({ error: "invalid_machine_id" });
  }

  try {
    const sql = getSql();
    await sql`
      INSERT INTO recording_usage (machine_id_hash, recordings_count, total_seconds, app_version)
      VALUES (${machineIdHash}, 1, ${durationSec}, ${appVersion})
      ON CONFLICT (machine_id_hash)
      DO UPDATE SET recordings_count = recording_usage.recordings_count + 1,
                    total_seconds    = recording_usage.total_seconds + ${durationSec},
                    app_version      = COALESCE(${appVersion}, recording_usage.app_version),
                    last_recorded_at = now(),
                    updated_at       = now()
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[usage] db error", err);
    return res.status(500).json({ error: "db_error" });
  }
}
