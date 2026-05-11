import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { CaptureStats } from "../types/capture";
import { type MeetingSession, type SavedUtterance, formatTime } from "./types";
import Sidebar from "./Sidebar";
import Library from "./Library";
import Recording from "./Recording";
import SessionDetail from "./SessionDetail";
import type { AppMode } from "../settings/prefs";
import styles from "./Meeting.module.css";

interface SttFinalPayload {
  text: string;
  language: string | null;
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
  appMode: AppMode;
  onAppModeChange: (m: AppMode) => void;
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
  appMode,
  onAppModeChange,
  onOpenSettings,
  captureRunning,
  setCaptureRunning,
  setLastStats,
  sessions,
  setSessions,
  keysOk,
}: Props) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clearToken, setClearToken] = useState(0);
  const [view, setView] = useState<"library" | "recording" | "detail">("library");
  const [recordingStart, setRecordingStart] = useState<Date | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // utterances: lifted from TranscriptView so handleStop can snapshot them
  const [utterances, setUtterances] = useState<SavedUtterance[]>([]);
  const idRef = useRef(0);
  // lastFinalAt: for merge-gap check (Fix 3)
  const lastFinalAtRef = useRef<Date | null>(null);

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
      listen<SttFinalPayload>("stt_final", (event) => {
        const { text, language } = event.payload;
        const speaker: "user" | "system" = language === "ko" ? "user" : "system";
        const id = ++idRef.current;
        const now = new Date();
        const nowStr = formatTimeWithSec(now);

        // Evict oldest entry when cap exceeded
        if (pendingTotal() >= 50) {
          const firstKey = pendingTranslation.keys().next().value;
          if (firstKey !== undefined) {
            const q = pendingTranslation.get(firstKey)!;
            q.shift();
            if (q.length === 0) pendingTranslation.delete(firstKey);
          }
        }

        setUtterances((prev) => {
          const last = prev[prev.length - 1];
          const gapMs = lastFinalAtRef.current
            ? now.getTime() - lastFinalAtRef.current.getTime()
            : Infinity;

          // Fix 3 — Soniox short-final merge: 동일 speaker, 3초 내, 250자 미만,
          // koText 아직 null(번역 안 온 상태) 인 경우 직전 row 에 append.
          const shouldMerge =
            last &&
            last.speaker === speaker &&
            gapMs < 3000 &&
            last.enText.length + text.length < 250 &&
            last.koText === null;

          let next: SavedUtterance[];
          if (shouldMerge) {
            // 직전 utterance 에 append — row 는 새로 만들지 않음
            next = prev.slice(0, -1);
            next.push({ ...last, enText: `${last.enText} ${text}`.trim() });
            // 새 text 도 last.id 로 매핑: translation_final 이 오면 올바른 row 에 반영
            // NOTE: old last.enText key 는 그대로 두어 먼저 온 번역은 first-chunk 번역으로
            // koText 에 기록됨. koText 가 한 번 set 되면 이후 merge 가 차단되므로 허용 가능.
            const q = pendingTranslation.get(text) ?? [];
            q.push(last.id);
            pendingTranslation.set(text, q);
          } else {
            next = [
              ...prev,
              { id, time: nowStr, speaker, enText: text, koText: null },
            ];
            const q = pendingTranslation.get(text) ?? [];
            q.push(id);
            pendingTranslation.set(text, q);
          }

          return next.length > MAX_UTTERANCES ? next.slice(-MAX_UTTERANCES) : next;
        });

        lastFinalAtRef.current = now;
      }),

      listen<TranslationFinalPayload>("translation_final", (event) => {
        const { original, translation } = event.payload;
        const q = pendingTranslation.get(original);
        if (!q?.length) return;
        const targetId = q.shift()!;
        if (q.length === 0) pendingTranslation.delete(original);

        setUtterances((prev) =>
          prev.map((u) =>
            u.id === targetId ? { ...u, koText: translation } : u
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
    setRecordingStart(new Date());
    setErrorMsg(null);
    setUtterances([]);
    lastFinalAtRef.current = null;
    setClearToken((t) => t + 1);
    // Don't call setCaptureRunning here — RecordingControls's Start
    // button still owns the actual invoke('start_capture') call.
  };

  const handleStop = (stats: CaptureStats) => {
    setErrorMsg(null); // Fix 2 — errorMsg 잔존 방지
    setCaptureRunning(false);
    setLastStats(stats);
    const endedAt = new Date();
    const startedAt = recordingStart ?? endedAt;
    const durationSec = Math.max(
      1,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
    );
    // utterances 는 현재 render 의 state — setUtterances functional update 와
    // 달리 handleStop closure 는 최신 render 의 utterances 를 직접 읽음.
    // handleStop 이 memoized 되지 않으므로 매 render 마다 최신값 capture.
    const newSession: MeetingSession = {
      id: Date.now(),
      startedAt,
      endedAt,
      durationSec,
      title: `Meeting · ${formatTime(startedAt)}`,
      preview:
        utterances[0]?.enText?.slice(0, 80) ??
        "Bartleby would prefer not to summarise yet.",
      stats,
      transcript: [...utterances], // snapshot
    };
    setSessions([...sessions, newSession]);
    setView("library");
    setRecordingStart(null);
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
        appMode={appMode}
        onAppModeChange={onAppModeChange}
        onOpenSettings={onOpenSettings}
        captureRunning={captureRunning}
        recordingStart={recordingStart}
        keysOk={keysOk}
        sessionCount={sessions.length}
        view={view === "detail" ? "library" : view}
      />
      <div className={styles.main}>
        {view === "library" ? (
          <Library
            sessions={sessions}
            onStartRecord={handleStartRecord}
            onSelectSession={handleSelectSession}
          />
        ) : view === "recording" ? (
          <Recording
            captureRunning={captureRunning}
            recordingStart={recordingStart}
            onStart={() => setCaptureRunning(true)}
            onStop={handleStop}
            onError={(msg) => {
              setCaptureRunning(false);
              setErrorMsg(msg);
              setView("library");
            }}
            clearToken={clearToken}
            utterances={utterances}
          />
        ) : (
          <SessionDetail
            session={sessions.find((s) => s.id === selectedSessionId)!}
            onBack={handleBackToLibrary}
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
