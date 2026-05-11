import type { CaptureStats } from "../types/capture";

export interface MeetingSession {
  id: number;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  title: string;
  preview: string;
  stats: CaptureStats;
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
