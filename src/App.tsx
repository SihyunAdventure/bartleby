import { lazy, Suspense, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Settings from "./settings/Settings";
import Segmented from "./components/Segmented";
import Meeting from "./meeting/Meeting";
import { loadPrefs, listenToPrefs, setPref, type AppMode } from "./settings/prefs";
import type { CaptureStats } from "./types/capture";
import type { MeetingSession } from "./meeting/types";
import "./App.css";

const SESSIONS_STORAGE_KEY = "bartleby.sessions.v1";

// Restore sessions from localStorage. Date 필드는 JSON 직렬화 후 string 이 되므로
// new Date(s) 로 다시 hydrate. parse 또는 schema 오류 시 빈 배열 반환 (graceful).
function loadSessions(): MeetingSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<
      Omit<MeetingSession, "startedAt" | "endedAt"> & {
        startedAt: string;
        endedAt: string;
      }
    >;
    return parsed.map((s) => ({
      ...s,
      startedAt: new Date(s.startedAt),
      endedAt: new Date(s.endedAt),
      // 이전 버전에는 transcript 필드가 없을 수 있어 backfill
      transcript: s.transcript ?? [],
    }));
  } catch (e) {
    console.warn("[sessions] load failed:", e);
    return [];
  }
}

const Gallery = lazy(() => import("./gallery/Gallery"));

const params = new URLSearchParams(window.location.search);
const isGallery = params.has("gallery");

interface KeyStatus {
  present: boolean;
  source: "keychain" | "env" | null;
}

function App() {
  const [captureStatus, setCaptureStatus] = useState("");
  const [seconds, setSeconds] = useState(10);
  const [captureRunning, setCaptureRunning] = useState(false);
  const [lastStats, setLastStats] = useState<CaptureStats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keysMissing, setKeysMissing] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>(() => loadPrefs().app_mode);
  const [sessions, setSessions] = useState<MeetingSession[]>(loadSessions);
  const keysOk = !keysMissing;

  // Persist sessions to localStorage on every change. Date 필드는 string 으로
  // 직렬화되므로 load 시 다시 Date 로 hydrate (loadSessions 참조).
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn("[sessions] save failed:", e);
    }
  }, [sessions]);

  useEffect(() => {
    const unlistenPromise = listenToPrefs((p) => {
      setAppMode(p.app_mode);
    });
    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, []);

  const refreshKeyStatus = async () => {
    try {
      const [s, u] = await Promise.all([
        invoke<KeyStatus>("api_key_status", { name: "SONIOX_API_KEY" }),
        invoke<KeyStatus>("api_key_status", { name: "UPSTAGE_API_KEY" }),
      ]);
      setKeysMissing(!s.present || !u.present);
    } catch {
      // Backend down or command unavailable — leave banner hidden so we
      // don't pester the user about a transient issue.
    }
  };

  useEffect(() => {
    refreshKeyStatus();
  }, []);

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

  if (isGallery) {
    return (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    );
  }

  // watchShell — existing capture UI as JSX variable (avoids component-inside-render
  // remount issue while keeping the branch clean).
  const watchShell = (
    <>
      <button
        className="settings-gear"
        onClick={() => setSettingsOpen(true)}
        aria-label="Settings"
        title="Settings"
      >
        ⚙
      </button>

      <header className="capture-hero">
        <h1 className="display">bartleby</h1>
        <div className="serif-quote capture-epigraph">
          "I would prefer not to take notes."
        </div>
      </header>

      <div className="mode-switch-row">
        <Segmented
          options={[
            { value: "watch", label: "Watch" },
            { value: "meeting", label: "Meeting" },
          ]}
          value={appMode}
          onChange={(m) => {
            setAppMode(m);
            setPref("app_mode", m);
          }}
        />
      </div>

      {keysMissing && !settingsOpen && (
        <button
          className="key-banner"
          onClick={() => setSettingsOpen(true)}
        >
          Add API keys to start →
        </button>
      )}

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
                const { translate_enabled } = loadPrefs();
                const stats = await invoke<CaptureStats>("capture_system_audio", { seconds, translateEnabled: translate_enabled });
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
                const { translate_enabled } = loadPrefs();
                await invoke("start_capture", { translateEnabled: translate_enabled });
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
    </>
  );

  return (
    <main className="container" data-mode={appMode}>
      {appMode === "meeting" ? (
        <Meeting
          appMode={appMode}
          onAppModeChange={(m) => {
            setAppMode(m);
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          captureRunning={captureRunning}
          setCaptureRunning={setCaptureRunning}
          lastStats={lastStats}
          setLastStats={setLastStats}
          sessions={sessions}
          setSessions={setSessions}
          keysOk={keysOk}
        />
      ) : (
        watchShell
      )}
      {settingsOpen && (
        <Settings
          onClose={() => setSettingsOpen(false)}
          onChange={refreshKeyStatus}
        />
      )}
    </main>
  );
}

export default App;
