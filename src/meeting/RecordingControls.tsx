import { invoke } from "@tauri-apps/api/core";
import type { CaptureStats } from "../types/capture";
import styles from "./RecordingControls.module.css";

interface Props {
  captureRunning: boolean;
  onStart: () => void;
  onStop: (stats: CaptureStats) => void;
  onError: (msg: string) => void;
}

export default function RecordingControls({
  captureRunning,
  onStart,
  onStop,
  onError,
}: Props) {
  const handleStart = async () => {
    try {
      await invoke("start_capture");
      onStart();
    } catch (err) {
      onError(`Error: ${String(err)}`);
    }
  };

  const handleStop = async () => {
    try {
      const stats = await invoke<CaptureStats>("stop_capture");
      onStop(stats);
    } catch (err) {
      onError(`Error: ${String(err)}`);
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.header}>Recording controls</p>
      <div className={styles.row}>
        <button
          className="btn btn-primary"
          disabled={captureRunning}
          onClick={handleStart}
        >
          Start
        </button>
        <button
          className="btn"
          disabled={!captureRunning}
          onClick={handleStop}
        >
          Stop
        </button>
        <p
          className={styles.statusText}
          data-recording={captureRunning ? "true" : "false"}
        >
          {captureRunning ? (
            <>
              <span className={styles.recDot} />
              Recording…
            </>
          ) : (
            "Idle"
          )}
        </p>
      </div>
    </div>
  );
}
