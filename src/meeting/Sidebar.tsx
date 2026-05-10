import Segmented from "../components/Segmented";
import { setPref, type AppMode } from "../settings/prefs";
import type { CaptureStats } from "../types/capture";
import styles from "./Sidebar.module.css";

interface Props {
  appMode: AppMode;
  onAppModeChange: (m: AppMode) => void;
  onOpenSettings: () => void;
  captureRunning: boolean;
  lastStats: CaptureStats | null;
}

export default function Sidebar({
  appMode,
  onAppModeChange,
  onOpenSettings,
  captureRunning,
  lastStats,
}: Props) {
  const handleModeChange = (m: AppMode) => {
    onAppModeChange(m);
    setPref("app_mode", m);
  };

  const recordingState = captureRunning
    ? "Recording…"
    : lastStats
    ? "Stopped"
    : "Idle";

  const driftMs = lastStats
    ? `${lastStats.drift.max_drift_ms.toFixed(2)} ms`
    : "—";

  const peakDbfs = lastStats
    ? `${lastStats.peak_system_dbfs.toFixed(1)} dBFS`
    : "—";

  const rss = lastStats
    ? `${lastStats.rss.peak_rss_mb.toFixed(0)} MB`
    : "—";

  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.logo}>bartleby</h1>
      <p className={styles.epigraph}>
        "I would prefer not to take notes."
      </p>

      <div className={styles.modeRow}>
        <Segmented
          options={[
            { value: "watch", label: "Watch" },
            { value: "meeting", label: "Meeting" },
          ]}
          value={appMode}
          onChange={handleModeChange}
        />
      </div>

      <button className={styles.settingsBtn} onClick={onOpenSettings}>
        ⚙ Settings
      </button>

      <hr className={styles.divider} />

      <div className={styles.statusBlock}>
        <p className={styles.statusLabel}>Status</p>

        <div className={styles.statusRow}>
          <span
            className={styles.statusDot}
            data-recording={captureRunning ? "true" : "false"}
          />
          <p className={styles.statusText}>{recordingState}</p>
        </div>

        <p className={styles.statusStat}>drift {driftMs}</p>
        <p className={styles.statusStat}>peak {peakDbfs}</p>
        <p className={styles.statusStat}>rss {rss}</p>
      </div>
    </aside>
  );
}
