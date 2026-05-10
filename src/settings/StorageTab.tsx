import { useEffect, useState } from "react";
import { loadPrefs, setPref } from "./prefs";
import Slider from "../components/Slider";
import styles from "./StorageTab.module.css";

const DEFERRED_TOOLTIP = "추후 슬라이스 (tauri-plugin-fs/dialog 추가 필요)";

export default function StorageTab() {
  const [savePath, setSavePath] = useState("~/Documents/Bartleby/");
  const [retentionDays, setRetentionDays] = useState(30);

  useEffect(() => {
    const p = loadPrefs();
    setSavePath(p.save_path);
    setRetentionDays(p.audio_retention_days);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <div className={styles.rowLeft}>
          <span className={styles.rowLabel}>Save notes to</span>
          <span className={styles.pathDisplay}>{savePath}</span>
        </div>
        <button className="btn" disabled title={DEFERRED_TOOLTIP}>
          Choose…
        </button>
      </div>

      <div className={styles.sliderRow}>
        <span className={styles.rowLabel}>Audio retention</span>
        <Slider
          min={1}
          max={90}
          step={1}
          value={retentionDays}
          unit=" days"
          onChange={(v) => {
            setRetentionDays(v);
            setPref("audio_retention_days", v);
          }}
        />
        <p className={styles.helper}>Transcripts are kept indefinitely.</p>
      </div>

      <div className={styles.row}>
        <span className={styles.rowLabel}>Disk usage</span>
        <span className={styles.diskValue}>—</span>
      </div>

      <div className={styles.buttonRow}>
        <button className="btn" disabled title={DEFERRED_TOOLTIP}>
          Open in Finder
        </button>
        <button className="btn" disabled title={DEFERRED_TOOLTIP}>
          Clean up old audio
        </button>
      </div>
    </div>
  );
}
