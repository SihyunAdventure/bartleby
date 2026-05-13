import { invoke } from "@tauri-apps/api/core";
import type { CaptureStats } from "../types/capture";
import { loadPrefs } from "../settings/prefs";
import styles from "./RecordingControls.module.css";

interface Props {
  captureRunning: boolean;
  onStart: () => void;
  onStop: (stats: CaptureStats) => void;
  onError: (msg: string) => void;
  /** Fires synchronously the moment the Stop button is clicked, *before* we
   *  await backend stop_capture. Lets the parent freeze its STT listeners so
   *  in-flight finals delivered during the ~1s teardown can't mutate state. */
  onStopClick?: () => void;
}

export default function RecordingControls({
  captureRunning,
  onStart,
  onStop,
  onError,
  onStopClick,
}: Props) {
  const handleStart = async () => {
    try {
      // pref 를 매 start 시점에 읽음 — 사용자가 Settings 에서 토글한 뒤 바로
      // Start 누르면 그 값으로 capture 가 시작됨.
      const { translate_enabled } = loadPrefs();
      await invoke("start_capture", { translateEnabled: translate_enabled });
      onStart();
    } catch (err) {
      onError(`Error: ${String(err)}`);
    }
  };

  const handleStop = async () => {
    onStopClick?.();
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
