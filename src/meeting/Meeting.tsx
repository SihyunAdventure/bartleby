import { useState } from "react";
import type { CaptureStats } from "../types/capture";
import { type MeetingSession, formatTime } from "./types";
import Sidebar from "./Sidebar";
import Library from "./Library";
import Recording from "./Recording";
import type { AppMode } from "../settings/prefs";
import styles from "./Meeting.module.css";

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
  const [view, setView] = useState<"library" | "recording">("library");
  const [recordingStart, setRecordingStart] = useState<Date | null>(null);

  const handleStartRecord = () => {
    setView("recording");
    setRecordingStart(new Date());
    setErrorMsg(null);
    setClearToken((t) => t + 1);
    // Don't call setCaptureRunning here — RecordingControls's Start
    // button still owns the actual invoke('start_capture') call.
  };

  const handleStop = (stats: CaptureStats) => {
    setCaptureRunning(false);
    setLastStats(stats);
    const endedAt = new Date();
    const startedAt = recordingStart ?? endedAt;
    const durationSec = Math.max(
      1,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
    );
    const newSession: MeetingSession = {
      id: Date.now(),
      startedAt,
      endedAt,
      durationSec,
      title: `Meeting · ${formatTime(startedAt)}`,
      preview: "Bartleby would prefer not to summarise yet.",
      stats,
    };
    setSessions([...sessions, newSession]);
    setView("library");
    setRecordingStart(null);
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
        view={view}
      />
      <div className={styles.main}>
        {view === "library" ? (
          <Library sessions={sessions} onStartRecord={handleStartRecord} />
        ) : (
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
