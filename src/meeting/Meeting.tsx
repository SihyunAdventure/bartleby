import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { CaptureStats } from "../types/capture";
import { type MeetingSession, type SavedUtterance, formatTime } from "./types";
import { persistSessions } from "./sessionsStore";
import { trackRecordingStarted, trackRecordingStopped } from "../analytics/analytics";

// Bridge frontend logs into the Rust debug.log via the log_frontend command,
// so handleStop's flow is visible without opening the webview inspector.
const dbg = (msg: string) => {
  invoke("log_frontend", { msg }).catch(() => {});
};
import Sidebar, { type LibraryFilter } from "./Sidebar";
import Library from "./Library";
import Recording from "./Recording";
import SessionDetail from "./SessionDetail";
import styles from "./Meeting.module.css";

// Phase 6 S3 — Soniox sessions now carry a `source` tag ("sys" | "mic") so
// the frontend can pick the speaker label from the audio source rather than
// from the (heuristic) language. Optional for forward-compat: older builds
// without the field fall back to language-based labeling below.
type SttSource = "sys" | "mic";

interface SttFinalPayload {
  text: string;
  language: string | null;
  source?: SttSource;
}

interface SttPartialPayload {
  text: string;
  language: string | null;
  source?: SttSource;
}

function speakerFor(source: SttSource | undefined, language: string | null): "user" | "system" {
  if (source === "mic") return "user";
  if (source === "sys") return "system";
  // Pre-Phase-6-S3 fallback — Korean → "user" was a heuristic for the
  // mic-deferred era. Once the dual-session backend is live, source is
  // always present, but keep the fallback so a frontend-only deploy
  // against an older backend doesn't crash.
  return language === "ko" ? "user" : "system";
}

export interface PartialEntry {
  text: string;
  speaker: "user" | "system";
}

interface TranslationFinalPayload {
  original: string;
  translation: string;
}

const MAX_UTTERANCES = 100;

// formatTimeWithSec: TranscriptView 의 내부 formatTime 과 동일 (HH:MM:SS)
function formatTimeWithSec(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

interface Props {
  onOpenSettings: () => void;
  captureRunning: boolean;
  setCaptureRunning: (v: boolean) => void;
  lastStats: CaptureStats | null;
  setLastStats: (v: CaptureStats | null) => void;
  sessions: MeetingSession[];
  setSessions: (v: MeetingSession[]) => void;
  keysOk: boolean;
}

export default function Meeting({
  onOpenSettings,
  captureRunning,
  setCaptureRunning,
  setLastStats,
  sessions,
  setSessions,
  keysOk,
}: Props) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [view, setView] = useState<"library" | "recording" | "detail">("library");
  const [recordingStart, setRecordingStart] = useState<Date | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");

  // Date-bucketed views. Today = startedAt is on or after local midnight.
  // Week = startedAt is within the last 7 days from now (rolling, not
  // calendar week — matches "what did I record this week" intuition).
  const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const todayCount = sessions.filter((s) => s.startedAt.getTime() >= dayStart).length;
  const weekCount = sessions.filter((s) => s.startedAt.getTime() >= weekStart).length;
  const filteredSessions =
    libraryFilter === "today"
      ? sessions.filter((s) => s.startedAt.getTime() >= dayStart)
      : libraryFilter === "week"
      ? sessions.filter((s) => s.startedAt.getTime() >= weekStart)
      : sessions;
  const libraryTitle =
    libraryFilter === "today"
      ? "Today"
      : libraryFilter === "week"
      ? "This week"
      : "All meetings";

  // utterances: lifted from TranscriptView so handleStop can snapshot them
  const [utterances, setUtterances] = useState<SavedUtterance[]>([]);
  // partial: in-flight STT before endpointing. Renders as a ghost row in
  // TranscriptView (italic + opacity) so users see live token flow instead
  // of waiting ~7s for Soniox to finalise the utterance.
  const [partial, setPartial] = useState<PartialEntry | null>(null);
  const idRef = useRef(0);
  // lastFinalAt: for merge-gap check (Fix 3)
  const lastFinalAtRef = useRef<Date | null>(null);
  // frozenRef: set true on Stop click — listeners ignore any in-flight finals
  // delivered while backend stop_capture is still wrapping up. Without this
  // the SessionDetail snapshot diverges from the live view (extra rows /
  // longer rows from STT continuing for ~1s after Stop).
  const frozenRef = useRef(false);

  // stt_final + translation_final listeners — only active while recording
  useEffect(() => {
    if (view !== "recording") return;

    // FIFO queue per raw text: translation_final carries only `original` text,
    // so we match by dequeuing the oldest pending id for that text string.
    // Cap at 50 total queued ids to bound memory when translations stall.
    const pendingTranslation = new Map<string, number[]>();

    const pendingTotal = () =>
      [...pendingTranslation.values()].reduce((s, q) => s + q.length, 0);

    const subs = [
      listen<SttPartialPayload>("stt_partial", (event) => {
        if (frozenRef.current) return;
        const { text, language, source } = event.payload;
        if (!text) {
          setPartial(null);
          return;
        }
        const speaker = speakerFor(source, language);
        setPartial({ text, speaker });
      }),

      listen<SttFinalPayload>("stt_final", (event) => {
        if (frozenRef.current) return;
        const { text, language, source } = event.payload;
        const speaker = speakerFor(source, language);
        const now = new Date();
        const nowStr = formatTimeWithSec(now);
        setPartial(null);

        // Sentence-split the incoming final. Soniox often delivers a single
        // final that spans multiple sentences ("...should I walk? And the
        // state-of-the-art models..."); without splitting, the row ends mid-
        // monologue and chunking merge can't recover the boundary later.
        // lookbehind on .?! followed by whitespace.
        const parts = text
          .split(/(?<=[.?!])\s+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        if (parts.length === 0) return;

        if (pendingTotal() >= 50) {
          const firstKey = pendingTranslation.keys().next().value;
          if (firstKey !== undefined) {
            const q = pendingTranslation.get(firstKey)!;
            q.shift();
            if (q.length === 0) pendingTranslation.delete(firstKey);
          }
        }

        let lastNewId = idRef.current;
        setUtterances((prev) => {
          const next: SavedUtterance[] = [...prev];
          for (const part of parts) {
            const last = next[next.length - 1];
            const gapMs = lastFinalAtRef.current
              ? now.getTime() - lastFinalAtRef.current.getTime()
              : Infinity;
            // Phase 6 S3 — gap-based merge with a length cap. Pure
            // sentence-boundary split fragmented Korean ("...입니다." 마다
            // 새 row); pure gap-based merge produced one-row English
            // lectures that spanned ~6 sentences. Balance: merge by gap
            // up to ~200 chars, then a sentence boundary breaks into a
            // fresh row. Long mid-sentence monologues stay on the same
            // row until punctuation arrives (no mid-clause break).
            const ROW_SOFT_CAP = 200;
            const lastEndsSentence = last
              ? /[.?!]["')\]]?\s*$/.test(last.enText)
              : false;
            const lastTooLongAtBoundary =
              !!last && last.enText.length > ROW_SOFT_CAP && lastEndsSentence;
            const shouldMerge =
              !!last &&
              last.speaker === speaker &&
              gapMs < 3000 &&
              !lastTooLongAtBoundary;
            if (shouldMerge && last) {
              next[next.length - 1] = {
                ...last,
                enText: `${last.enText} ${part}`.trim(),
              };
              lastNewId = last.id;
            } else {
              const id = ++idRef.current;
              next.push({
                id,
                time: nowStr,
                speaker,
                enText: part,
                koText: null,
              });
              lastNewId = id;
            }
          }
          return next.length > MAX_UTTERANCES
            ? next.slice(-MAX_UTTERANCES)
            : next;
        });

        // Best-effort translation mapping: pair the entire incoming text with
        // the most recently touched row. translation_final carries the full
        // EN text as `original`, so this works for single-sentence finals and
        // degrades gracefully for multi-sentence ones (KO lands on the last
        // row only — acceptable while translate toggle is default-off).
        const q = pendingTranslation.get(text) ?? [];
        q.push(lastNewId);
        pendingTranslation.set(text, q);

        lastFinalAtRef.current = now;
      }),

      listen<TranslationFinalPayload>("translation_final", (event) => {
        if (frozenRef.current) return;
        const { original, translation } = event.payload;
        const q = pendingTranslation.get(original);
        if (!q?.length) return;
        const targetId = q.shift()!;
        if (q.length === 0) pendingTranslation.delete(original);

        // 같은 row 에 여러 EN chunk 가 merge 된 상태면, 그에 대한 번역들도
        // 시간 순서대로 도착하므로 기존 koText 에 append (cumulative).
        setUtterances((prev) =>
          prev.map((u) =>
            u.id === targetId
              ? {
                  ...u,
                  koText: u.koText
                    ? `${u.koText} ${translation}`.trim()
                    : translation,
                }
              : u
          )
        );
      }),
    ];

    return () => {
      subs.forEach((p) => p.then((fn) => fn()));
    };
  }, [view]);

  const handleStartRecord = () => {
    setView("recording");
    // Don't set recordingStart here — the user may dwell on the Recording
    // screen for a few seconds before actually clicking Start. recordingStart
    // is set in onStart below, the moment backend start_capture returns.
    setRecordingStart(null);
    setErrorMsg(null);
    setUtterances([]);
    setPartial(null);
    lastFinalAtRef.current = null;
    frozenRef.current = false;
  };

  const handleStop = (stats: CaptureStats) => {
    dbg(`handleStop fired stats=${JSON.stringify(stats).slice(0, 200)}`);
    try {
    // Freeze immediately so any in-flight stt_final / translation_final
    // arriving while backend stop_capture wraps up cannot mutate state.
    // This keeps the SessionDetail snapshot identical to the live view at
    // the moment of Stop.
    frozenRef.current = true;
    setErrorMsg(null);
    setCaptureRunning(false);
    setLastStats(stats);
    const endedAt = new Date();
    const startedAt = recordingStart ?? endedAt;
    const durationSec = Math.max(
      1,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
    );
    trackRecordingStopped(durationSec);
    // Report exact duration to the usage backend (neon). Fire-and-forget,
    // non-fatal — numbers only, never meeting content.
    invoke("record_usage", { durationSec }).catch(() => {});

    // If a partial ghost was visible at Stop, commit it as a final row so
    // the saved transcript visually matches the live screen.
    let finalUtterances = utterances;
    if (partial && partial.text.length > 0) {
      finalUtterances = [
        ...utterances,
        {
          id: ++idRef.current,
          time: formatTimeWithSec(endedAt),
          speaker: partial.speaker,
          enText: partial.text,
          koText: null,
        },
      ];
    }

    const newSession: MeetingSession = {
      id: Date.now(),
      startedAt,
      endedAt,
      durationSec,
      title: `Meeting · ${formatTime(startedAt)}`,
      preview:
        finalUtterances[0]?.enText?.slice(0, 80) ??
        "Bartleby would prefer not to summarise yet.",
      stats,
      transcript: finalUtterances,
    };
    dbg(`handleStop saving session id=${newSession.id} rows=${finalUtterances.length} sessions_len_before=${sessions.length}`);
    const updated = [...sessions, newSession];
    setSessions(updated);
    // Direct write: bypass the App.tsx useEffect's render-cycle race.
    // setSessions schedules React state, but the actual sessionsStore.save()
    // doesn't fire until the next render commit — if anything kills the
    // process (dev-run.sh rebuild, crash) in that window, the write is lost.
    persistSessions(updated)
      .then(() => dbg(`handleStop persistSessions resolved`))
      .catch((e) => dbg(`handleStop persistSessions rejected: ${String(e)}`));
    // Phase 5 S3 — go directly to SessionDetail. The user just clicked Stop;
    // making them then click their freshly-made session from Library is
    // friction. SessionDetail handles the "Bartleby is finalising…" state.
    setSelectedSessionId(newSession.id);
    setView("detail");
    setRecordingStart(null);
    } catch (e) {
      dbg(`handleStop THREW: ${String(e)}`);
      setErrorMsg(`Stop save failed: ${String(e)}`);
      setCaptureRunning(false);
      setView("library");
    }
  };

  const handleSelectSession = (id: number) => {
    setSelectedSessionId(id);
    setView("detail");
  };

  const handleBackToLibrary = () => {
    setSelectedSessionId(null);
    setView("library");
  };

  return (
    <div className={styles.shell}>
      <Sidebar
        onOpenSettings={onOpenSettings}
        captureRunning={captureRunning}
        keysOk={keysOk}
        sessionCount={sessions.length}
        todayCount={todayCount}
        weekCount={weekCount}
        view={view === "detail" ? "library" : view}
        libraryFilter={libraryFilter}
        onSelectFilter={(f) => {
          setLibraryFilter(f);
          // Don't yank the user out of an active recording — backend
          // capture would keep running but the listeners unmount and
          // the live transcript disappears, which reads as "녹음이
          // 꺼져버림". Only auto-navigate to the (now filtered) Library
          // when nothing is live; otherwise just store the filter so
          // it takes effect once they're done recording.
          if (view !== "library" && !captureRunning) {
            setSelectedSessionId(null);
            setView("library");
          }
        }}
      />
      <div className={styles.main}>
        {view === "library" ? (
          <Library
            title={libraryTitle}
            sessions={filteredSessions}
            onStartRecord={handleStartRecord}
            onSelectSession={handleSelectSession}
          />
        ) : view === "recording" ? (
          <Recording
            captureRunning={captureRunning}
            recordingStart={recordingStart}
            onStart={() => {
              setCaptureRunning(true);
              setRecordingStart(new Date());
              trackRecordingStarted();
            }}
            onStop={handleStop}
            onError={(msg) => {
              setCaptureRunning(false);
              setErrorMsg(msg);
              setView("library");
            }}
            onStopClick={() => {
              // Fires synchronously on Stop button click, before the ~1s
              // backend stop_capture await. Disable the button immediately
              // so a quick double-click can't send a second stop_capture
              // (the backend's AppState.capture is already take()n by the
              // first invoke and the duplicate call surfaces as the
              // "No capture in progress" toast). Freeze listeners next so
              // any in-flight finals are ignored, then commit the current
              // partial as a real row so the live view's last utterance
              // lands in the saved transcript.
              setCaptureRunning(false);
              frozenRef.current = true;
              if (partial && partial.text.length > 0) {
                const id = ++idRef.current;
                const now = new Date();
                const nowStr = formatTimeWithSec(now);
                setUtterances((prev) => [
                  ...prev,
                  {
                    id,
                    time: nowStr,
                    speaker: partial.speaker,
                    enText: partial.text,
                    koText: null,
                  },
                ]);
                setPartial(null);
              }
            }}
            utterances={utterances}
            partial={partial}
          />
        ) : (
          <SessionDetail
            session={sessions.find((s) => s.id === selectedSessionId)!}
            onBack={handleBackToLibrary}
            onSessionUpdate={(updated) =>
              setSessions(
                sessions.map((s) => (s.id === updated.id ? updated : s))
              )
            }
          />
        )}
        {errorMsg && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--t-xs)",
              color: "var(--danger)",
              margin: 0,
            }}
          >
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
