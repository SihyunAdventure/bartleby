import { neon } from "@neondatabase/serverless";

// POST /api/review — in-app feedback: {machineIdHash, rating?, body, appVersion}.
// rating is an optional 1–5 star score; body is free-text feedback the user typed
// (their own words — not meeting content). Stored in Neon for product feedback.

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
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 5000) : "";

  let rating = body.rating == null ? null : Number(body.rating);
  if (rating != null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) rating = null;

  if (machineIdHash.length < 16 || machineIdHash.length > 128) {
    return res.status(400).json({ error: "invalid_machine_id" });
  }
  if (!text && rating == null) {
    return res.status(400).json({ error: "empty_review" });
  }

  try {
    const sql = getSql();
    await sql`
      INSERT INTO reviews (machine_id_hash, rating, body, app_version)
      VALUES (${machineIdHash}, ${rating}, ${text || null}, ${appVersion})
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[review] db error", err);
    return res.status(500).json({ error: "db_error" });
  }
}
