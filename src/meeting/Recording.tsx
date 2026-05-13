import { useEffect, useState } from "react";
import TranscriptView from "./TranscriptView";
import RecordingControls from "./RecordingControls";
import type { CaptureStats } from "../types/capture";
import type { SavedUtterance } from "./types";
import type { PartialEntry } from "./Meeting";
import styles from "./Recording.module.css";

interface Props {
  captureRunning: boolean;
  recordingStart: Date | null;
  onStart: () => void;
  onStop: (stats: CaptureStats) => void;
  onError: (msg: string) => void;
  onStopClick?: () => void;
  utterances: SavedUtterance[];
  partial: PartialEntry | null;
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Recording({
  captureRunning,
  recordingStart,
  onStart,
  onStop,
  onError,
  onStopClick,
  utterances,
  partial,
}: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!captureRunning || !recordingStart) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [captureRunning, recordingStart]);

  const elapsed = recordingStart
    ? formatElapsed(Date.now() - recordingStart.getTime())
    : "--:--";

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Recording</h1>
          <div className={styles.eyebrow}>session · live</div>
        </div>
        <div className={styles.toolbarRight}>
          <span className={`meter ${captureRunning ? "rec" : ""}`}>
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className={styles.timer}>{elapsed}</span>
        </div>
      </div>
      <hr className="hr" />
      <div className={styles.bodyGrid}>
        <div className={styles.transcriptCol}>
          <TranscriptView utterances={utterances} partial={partial} />
        </div>
      </div>
      <div className={styles.footerControls}>
        <RecordingControls
          captureRunning={captureRunning}
          onStart={onStart}
          onStop={onStop}
          onError={onError}
          onStopClick={onStopClick}
        />
      </div>
    </div>
  );
}
