import Database from "@tauri-apps/plugin-sql";

// Dictations live in the same SQLite DB as meeting sessions
// (sqlite:bartleby.db) but in a separate `dictations` table, created by
// lib.rs's add_migrations (version 2). Schema mirrors sessions: unix-millis
// timestamps, soft-delete via deleted_at, updated_at for last-write-wins
// sync. Each push-to-talk dictation is persisted on commit (see the
// `dictation_committed` listener in Meeting.tsx).

const DB_URL = "sqlite:bartleby.db";

let dbPromise: Promise<Database> | null = null;
function db(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_URL);
  }
  return dbPromise;
}

interface DictationRow {
  id: number;
  text: string;
  duration_ms: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Dictation {
  id: number;
  text: string;
  /** Spoken length in ms (Fn press→release). 0 for legacy rows. */
  durationMs: number;
  createdAt: Date;
}

function rowToDictation(row: DictationRow): Dictation {
  return {
    id: row.id,
    text: row.text,
    durationMs: row.duration_ms ?? 0,
    createdAt: new Date(row.created_at),
  };
}

export async function loadDictations(): Promise<Dictation[]> {
  try {
    const conn = await db();
    const rows = await conn.select<DictationRow[]>(
      "SELECT id, text, duration_ms, created_at, updated_at, deleted_at FROM dictations WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    return rows.map(rowToDictation);
  } catch (e) {
    console.warn("[dictations] load failed:", e);
    return [];
  }
}

/** Insert a freshly-committed dictation. id = Date.now() (same convention as
 *  sessions), created_at/updated_at = now. Returns the new record so the
 *  caller can prepend it to its in-memory list without a reload. */
export async function saveDictation(text: string, durationMs = 0): Promise<Dictation> {
  const conn = await db();
  const now = Date.now();
  const id = now;
  await conn.execute(
    "INSERT INTO dictations (id, text, duration_ms, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, NULL)",
    [id, text, durationMs, now, now]
  );
  return { id, text, durationMs, createdAt: new Date(now) };
}

/** Soft-delete a dictation — sets deleted_at so future cloud-sync can
 *  propagate the tombstone instead of reconciling a missing row. */
export async function deleteDictation(id: number): Promise<void> {
  try {
    const conn = await db();
    await conn.execute(
      "UPDATE dictations SET deleted_at = unixepoch() * 1000, updated_at = unixepoch() * 1000 WHERE id = ?",
      [id]
    );
  } catch (e) {
    console.warn("[dictations] delete failed:", e);
    throw e;
  }
}
