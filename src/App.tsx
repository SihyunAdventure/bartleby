import { lazy, Suspense, useEffect, useState, type CSSProperties } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

const Gallery = lazy(() => import("./gallery/Gallery"));

const params = new URLSearchParams(window.location.search);
const isOverlay = params.has("overlay");
const isGallery = params.has("gallery");

interface DrmStatusPayload {
  drm_blocked: boolean;
  peak_dbfs: number;
}

function Overlay() {
  // Drag wiring requires three pieces working together (any one missing →
  // silent no-op): (1) `data-tauri-drag-region` attribute below, (2)
  // `core:window:allow-start-dragging` capability + overlay listed in
  // capabilities/default.json, (3) `acceptFirstMouse: true` on the overlay
  // window in tauri.conf.json so inactive-state first click reaches drag.js.
  const [drmBlocked, setDrmBlocked] = useState(false);

  useEffect(() => {
    const unlistenPromise = listen<DrmStatusPayload>("drm_status", (event) => {
      setDrmBlocked(event.payload.drm_blocked);
    });
    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, []);

  // The detector flags any sustained silence — could be DRM, mute, paused
  // playback, or wrong audio routing. Without mic cross-check (Phase 1+,
  // gated on signed builds) we can't tell which, so the message stays
  // neutral. Bartleby's signature refusal line is reserved for confirmed
  // DRM cases later.
  const text = drmBlocked
    ? "No audio detected."
    : "Awaiting English audio.";

  return (
    <div
      data-tauri-drag-region
      // TODO(Day 20+ §15 Mode Switch): migrate inline rgba() to var(--paper) + opacity
      //   and var(--ink-3) once data-theme cascade lands. Tokens.css is now imported
      //   globally so the migration is just CSS, not infra.
      style={{
        width: "100%",
        height: "100vh",
        background: "rgba(248, 247, 244, 0.85)",
        backdropFilter: "blur(12px)",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 13,
        fontStyle: "italic",
        color: "rgba(40, 40, 40, 0.6)",
        WebkitUserSelect: "none",
        padding: "0 16px",
        textAlign: "center",
      } as CSSProperties}
    >
      {text}
    </div>
  );
}

interface DriftStats {
  max_drift_ms: number;
  final_drift_ms: number;
  paired_samples: number;
}

interface RssStats {
  samples: number;
  peak_rss_mb: number;
  mean_rss_mb: number;
  log_path: string;
}

interface CaptureStats {
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

function App() {
  const [captureStatus, setCaptureStatus] = useState("");
  const [seconds, setSeconds] = useState(10);
  const [captureRunning, setCaptureRunning] = useState(false);

  const formatStats = (stats: CaptureStats): string => {
    const drmTag = stats.drm_detected
      ? `silent (peak ${stats.peak_system_dbfs.toFixed(1)} dBFS — muted/paused/DRM?) | `
      : `level peak ${stats.peak_system_dbfs.toFixed(1)} dBFS | `;
    return (
      drmTag +
      `sys: ${stats.buffers_received}b / ${stats.system_segments_written}seg / ${(stats.system_bytes_written / 1024).toFixed(1)}KB | ` +
      `mic: ${stats.mic_buffers_received}b / ${stats.mic_segments_written}seg / ${(stats.mic_bytes_written / 1024).toFixed(1)}KB | ` +
      `drift: max ${stats.drift.max_drift_ms.toFixed(2)}ms | ` +
      `peak ${stats.rss.peak_rss_mb.toFixed(0)}MB / ${stats.rss.samples} rss samples`
    );
  };

  if (isOverlay) {
    return <Overlay />;
  }

  if (isGallery) {
    return (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    );
  }

  return (
    <main className="container">
      <header className="capture-hero">
        <h1 className="display">bartleby</h1>
        <div className="serif-quote capture-epigraph">
          "I would prefer not to take notes."
        </div>
      </header>

      <section className="capture-panel">
        <div className="capture-row">
          <input
            type="number"
            min="10"
            max="3600"
            step="1"
            value={seconds}
            onChange={(e) => setSeconds(Number(e.currentTarget.value))}
          />
          <button
            className="btn"
            disabled={captureRunning}
            onClick={async () => {
              setCaptureStatus("Capturing...");
              try {
                const stats = await invoke<CaptureStats>("capture_system_audio", { seconds });
                setCaptureStatus(formatStats(stats));
              } catch (err) {
                setCaptureStatus(`Error: ${String(err)}`);
              }
            }}
          >
            Capture {seconds}s
          </button>
        </div>

        <div className="capture-row">
          <button
            className="btn btn-primary"
            disabled={captureRunning}
            onClick={async () => {
              try {
                await invoke("start_capture");
                setCaptureRunning(true);
                setCaptureStatus("Listening...");
              } catch (err) {
                setCaptureStatus(`Error: ${String(err)}`);
              }
            }}
          >
            Start capture
          </button>
          <button
            className="btn"
            disabled={!captureRunning}
            onClick={async () => {
              try {
                const stats = await invoke<CaptureStats>("stop_capture");
                setCaptureRunning(false);
                setCaptureStatus(formatStats(stats));
              } catch (err) {
                setCaptureRunning(false);
                setCaptureStatus(`Error: ${String(err)}`);
              }
            }}
          >
            Stop capture
          </button>
        </div>

        {captureStatus && (
          <p className="capture-status mono">{captureStatus}</p>
        )}
      </section>
    </main>
  );
}

export default App;
