import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

const isOverlay = new URLSearchParams(window.location.search).has("overlay");

function Overlay() {
  // Drag wiring requires three pieces working together (any one missing →
  // silent no-op): (1) `data-tauri-drag-region` attribute below, (2)
  // `core:window:allow-start-dragging` capability + overlay listed in
  // capabilities/default.json, (3) `acceptFirstMouse: true` on the overlay
  // window in tauri.conf.json so inactive-state first click reaches drag.js.
  return (
    <div
      data-tauri-drag-region
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
      } as React.CSSProperties}
    >
      Awaiting English audio.
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
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [captureStatus, setCaptureStatus] = useState("");
  const [seconds, setSeconds] = useState(10);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  if (isOverlay) {
    return <Overlay />;
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

      <div className="row">
        <input
          type="number"
          min="10"
          max="3600"
          step="1"
          value={seconds}
          onChange={(e) => setSeconds(Number(e.currentTarget.value))}
        />
        <button
          onClick={async () => {
            setCaptureStatus("Capturing...");
            try {
              const stats = await invoke<CaptureStats>("capture_system_audio", { seconds });
              const drmTag = stats.drm_detected
                ? `DRM blocked (peak ${stats.peak_system_dbfs.toFixed(1)} dBFS — Bartleby would prefer not to) | `
                : `level peak ${stats.peak_system_dbfs.toFixed(1)} dBFS | `;
              setCaptureStatus(
                drmTag +
                `sys: ${stats.buffers_received}b / ${stats.system_segments_written}seg / ${(stats.system_bytes_written / 1024).toFixed(1)}KB | ` +
                `mic: ${stats.mic_buffers_received}b / ${stats.mic_segments_written}seg / ${(stats.mic_bytes_written / 1024).toFixed(1)}KB | ` +
                `drift: max ${stats.drift.max_drift_ms.toFixed(2)}ms | ` +
                `peak ${stats.rss.peak_rss_mb.toFixed(0)}MB / ${stats.rss.samples} rss samples`
              );
            } catch (err) {
              setCaptureStatus(`Error: ${String(err)}`);
            }
          }}
        >
          Capture {seconds}s
        </button>
      </div>
      <p>{captureStatus}</p>
    </main>
  );
}

export default App;
