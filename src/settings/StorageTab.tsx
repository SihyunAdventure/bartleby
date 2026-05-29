import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { loadPrefs, setPref } from "./prefs";
import Slider from "../components/Slider";
import Toggle from "../components/Toggle";
import { setAnalyticsEnabled } from "../analytics/analytics";
import styles from "./StorageTab.module.css";

interface StorageStatus {
  app_data_dir: string;
  audio_dir: string;
  audio_bytes: number;
  database_bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[idx]}`;
}

export default function StorageTab() {
  const [retentionDays, setRetentionDays] = useState(30);
  const [analyticsEnabled, setAnalyticsEnabledState] = useState(true);
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      setStatus(await invoke<StorageStatus>("storage_status"));
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    const p = loadPrefs();
    setRetentionDays(p.audio_retention_days);
    setAnalyticsEnabledState(p.analytics_enabled);
    void refresh();
  }, []);

  const openFolder = async () => {
    try {
      setBusy(true);
      setError(null);
      await invoke("open_storage_folder");
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const cleanOldAudio = async () => {
    const ok = window.confirm(
      `Delete local audio files older than ${retentionDays} days? Transcripts and notes stay in Bartleby.`
    );
    if (!ok) return;
    try {
      setBusy(true);
      setError(null);
      setStatus(
        await invoke<StorageStatus>("cleanup_old_audio", {
          retentionDays,
        })
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <div className={styles.rowLeft}>
          <span className={styles.rowLabel}>App data folder</span>
          <span className={styles.pathDisplay}>
            {status?.app_data_dir ?? "Loading…"}
          </span>
        </div>
        <button className="btn" onClick={openFolder} disabled={busy}>
          Open in Finder
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
        <p className={styles.helper}>
          Clean up only removes local Opus audio older than this. Transcripts,
          summaries, and note metadata stay in SQLite.
        </p>
      </div>

      <div className={styles.sliderRow}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>사용 통계 보내기</span>
          <Toggle
            checked={analyticsEnabled}
            label="사용 통계 보내기"
            onChange={(v) => {
              setAnalyticsEnabledState(v);
              setPref("analytics_enabled", v);
              setAnalyticsEnabled(v);
            }}
          />
        </div>
        <p className={styles.helper}>
          제품 개선을 위해 익명 이벤트만 PostHog로 보냅니다: 앱 실행, 온보딩 완료,
          녹음 시작/종료(녹음 길이 구간), 노트 생성, hosted/BYOK 모드, 앱 버전.
          회의 오디오·transcript·요약·회의 제목·API 키는 절대 보내지 않습니다.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div>
          <span className={styles.rowLabel}>Audio</span>
          <span className={styles.diskValue}>
            {status ? formatBytes(status.audio_bytes) : "—"}
          </span>
        </div>
        <div>
          <span className={styles.rowLabel}>Database</span>
          <span className={styles.diskValue}>
            {status ? formatBytes(status.database_bytes) : "—"}
          </span>
        </div>
      </div>

      {status?.audio_dir && (
        <p className={styles.helper}>Audio directory: {status.audio_dir}</p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.buttonRow}>
        <button className="btn" onClick={refresh} disabled={busy}>
          Refresh
        </button>
        <button className="btn btn-destructive" onClick={cleanOldAudio} disabled={busy}>
          Clean up old audio
        </button>
      </div>
    </div>
  );
}
