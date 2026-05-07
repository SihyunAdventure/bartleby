import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface DriftStats {
  max_drift_ms: number;
  final_drift_ms: number;
  paired_samples: number;
}

interface CaptureStats {
  buffers_received: number;
  frames_written: number;
  seconds_captured: number;
  mic_buffers_received: number;
  mic_frames_written: number;
  mic_seconds_captured: number;
  drift: DriftStats;
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [captureStatus, setCaptureStatus] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
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

      <button
        onClick={async () => {
          setCaptureStatus("Capturing...");
          try {
            const stats = await invoke<CaptureStats>("capture_system_audio", { seconds: 10 });
            setCaptureStatus(
              `sys: ${stats.buffers_received}b/${stats.frames_written}f | ` +
              `mic: ${stats.mic_buffers_received}b/${stats.mic_frames_written}f | ` +
              `drift: max ${stats.drift.max_drift_ms.toFixed(2)}ms / final ${stats.drift.final_drift_ms.toFixed(2)}ms`
            );
          } catch (err) {
            setCaptureStatus(`Error: ${String(err)}`);
          }
        }}
      >
        Capture 10s
      </button>
      <p>{captureStatus}</p>
    </main>
  );
}

export default App;
