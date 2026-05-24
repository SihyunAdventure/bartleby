import Database from "@tauri-apps/plugin-sql";
import type { FinalSummary, MeetingSession, SavedUtterance } from "./types";
import type { CaptureStats } from "../types/capture";

// Phase 6 S5 — Sessions live in SQLite (tauri-plugin-sql) at
// {app_data}/bartleby.db. Schema is cloud-friendly (BIGINT/TEXT/INTEGER
// timestamps as unix millis, soft-delete via deleted_at, updated_at for
// last-write-wins sync). Future Neon migration: same SQL, swap
// `unixepoch() * 1000` → `EXTRACT(EPOCH FROM NOW()) * 1000` and INTEGER →
// BIGINT. The DB schema is created by lib.rs's add_migrations.
//
// Prior version used tauri-plugin-store JSON. Migration is free —
// previous JSON file (~/Library/Application Support/.../sessions.json)
// is ignored; old beta users start fresh.

const DB_URL = "sqlite:bartleby.db";

let dbPromise: Promise<Database> | null = null;
function db(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_URL);
  }
  return dbPromise;
}

interface SessionRow {
  id: number;
  started_at: number;
  ended_at: number;
  duration_sec: number;
  title: string;
  preview: string | null;
  summary: string | null;
  transcript_json: string;
  stats_json: string;
  audio_dir: string | null;
}

function rowToSession(row: SessionRow): MeetingSession {
  const transcript = JSON.parse(row.transcript_json) as SavedUtterance[];
  const stats = JSON.parse(row.stats_json) as CaptureStats;
  const finalSummary = row.summary
    ? (JSON.parse(row.summary) as FinalSummary)
    : undefined;
  return {
    id: row.id,
    startedAt: new Date(row.started_at),
    endedAt: new Date(row.ended_at),
    durationSec: row.duration_sec,
    title: row.title,
    preview: row.preview ?? "",
    finalSummary,
    stats,
    transcript,
  };
}

export async function loadSessions(): Promise<MeetingSession[]> {
  try {
    const conn = await db();
    const rows = await conn.select<SessionRow[]>(
      "SELECT id, started_at, ended_at, duration_sec, title, preview, summary, transcript_json, stats_json, audio_dir FROM sessions WHERE deleted_at IS NULL ORDER BY started_at ASC"
    );
    return rows.map(rowToSession);
  } catch (e) {
    console.warn("[sessions] load failed:", e);
    return [];
  }
}

/** Upsert a single session by id. Frontend pushes the whole array on
 *  every save call; we INSERT OR REPLACE each row so future cloud-sync
 *  diffing is row-granular. */
export async function persistSessions(sessions: MeetingSession[]): Promise<void> {
  try {
    const conn = await db();
    for (const s of sessions) {
      await conn.execute(
        "INSERT OR REPLACE INTO sessions (id, started_at, ended_at, duration_sec, title, preview, summary, transcript_json, stats_json, audio_dir, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM sessions WHERE id = ?), unixepoch() * 1000), unixepoch() * 1000, NULL)",
        [
          s.id,
          s.startedAt.getTime(),
          s.endedAt.getTime(),
          s.durationSec,
          s.title,
          s.preview ?? null,
          s.finalSummary ? JSON.stringify(s.finalSummary) : null,
          JSON.stringify(s.transcript ?? []),
          JSON.stringify(s.stats),
          null, // audio_dir — wired in a follow-up slice
          s.id,
        ]
      );
    }
    console.log(`[sessions] saved ${sessions.length} session(s) to SQLite`);
  } catch (e) {
    console.warn("[sessions] save failed:", e);
    throw e;
  }
}

/** Soft-delete a session — sets deleted_at so future cloud-sync can
 *  propagate the tombstone instead of having to reconcile a missing row. */
export async function deleteSession(id: number): Promise<void> {
  try {
    const conn = await db();
    await conn.execute(
      "UPDATE sessions SET deleted_at = unixepoch() * 1000, updated_at = unixepoch() * 1000 WHERE id = ?",
      [id]
    );
  } catch (e) {
    console.warn("[sessions] delete failed:", e);
    throw e;
  }
}
