import { useState } from "react";
import type { CaptureStats } from "../types/capture";
import Sidebar from "./Sidebar";
import TranscriptView from "./TranscriptView";
import RecordingControls from "./RecordingControls";
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
}

export default function Meeting({
  appMode,
  onAppModeChange,
  onOpenSettings,
  captureRunning,
  setCaptureRunning,
  lastStats,
  setLastStats,
}: Props) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // clearToken increments each time Start is pressed — signals TranscriptView to clear
  const [clearToken, setClearToken] = useState(0);

  const handleStart = () => {
    setCaptureRunning(true);
    setErrorMsg(null);
    setLastStats(null);
    setClearToken((t) => t + 1);
  };

  const handleStop = (stats: CaptureStats) => {
    setCaptureRunning(false);
    setLastStats(stats);
    setErrorMsg(null);
  };

  const handleError = (msg: string) => {
    setCaptureRunning(false);
    setErrorMsg(msg);
  };

  return (
    <div className={styles.shell}>
      <Sidebar
        appMode={appMode}
        onAppModeChange={onAppModeChange}
        onOpenSettings={onOpenSettings}
        captureRunning={captureRunning}
        lastStats={lastStats}
      />
      <div className={styles.main}>
        <TranscriptView clearToken={clearToken} />
        <RecordingControls
          captureRunning={captureRunning}
          onStart={handleStart}
          onStop={handleStop}
          onError={handleError}
        />
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
