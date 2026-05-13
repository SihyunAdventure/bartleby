import type { CaptureStats } from "../types/capture";

// SavedUtterance: 녹화 종료 시 MeetingSession 에 snapshot 되는 utterance 레코드.
// TranscriptView 의 내부 Utterance 와 동일한 shape 를 공유.
export interface SavedUtterance {
  id: number;
  time: string;
  speaker: "user" | "system";
  enText: string;
  koText: string | null;
}

/** Phase 5 S2 — finalize-on-Stop Solar Pro 3 batch output. */
export interface OutlineChunk {
  topic_title: string;
  bullets: string[];
  /** [first_utterance_id, last_utterance_id]. [0, 0] = LLM could not map.
   *  Used by SessionDetail to jump from outline chunk to transcript. */
  ref_utterance_ids: number[];
}

export interface FinalSummary {
  tldr: string;
  outline: OutlineChunk[];
  /** Markdown narrative with `## H2` sections. Rendered with react-markdown. */
  onepager: string;
  quote: string | null;
  /** ISO-8601. Set when the Solar Pro 3 batch returns. */
  generatedAt: string;
}

export interface MeetingSession {
  id: number;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  title: string;
  preview: string;
  stats: CaptureStats;
  transcript: SavedUtterance[]; // 녹화 종료 시 snapshot
  /** Filled after Solar Pro 3 finalize call returns. Absent on legacy v1
   *  sessions and on freshly-stopped sessions where finalize is still in
   *  flight or has failed. SessionDetail surfaces "Regenerate" in that case. */
  finalSummary?: FinalSummary;
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatRelativeDay(d: Date, now: Date = new Date()): string {
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return "오늘";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "어제";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
