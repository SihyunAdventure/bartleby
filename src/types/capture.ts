// Shared capture types — used by App.tsx (WatchShell), Meeting components.

export interface DriftStats {
  max_drift_ms: number;
  final_drift_ms: number;
  paired_samples: number;
}

export interface RssStats {
  samples: number;
  peak_rss_mb: number;
  mean_rss_mb: number;
  log_path: string;
}

export interface CaptureStats {
  buffers_received: number;
  frames_written: number;
  seconds_captured: number;
  mic_buffers_received: number;
  mic_frames_written: number;
  mic_seconds_captured: number;
  drift: DriftStats;
  system_segments_written: number;
  system_bytes_written: number;
  mic_segments_written: number;
  mic_bytes_written: number;
  rss: RssStats;
  peak_system_dbfs: number;
  drm_detected: boolean;
}
