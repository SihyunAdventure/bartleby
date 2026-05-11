import { lazy, Suspense, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Settings from "./settings/Settings";
import Meeting from "./meeting/Meeting";
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
  const [captureRunning, setCaptureRunning] = useState(false);
  const [lastStats, setLastStats] = useState<CaptureStats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keysMissing, setKeysMissing] = useState(false);
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

  if (isGallery) {
    return (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    );
  }

  return (
    <main className="container">
      <Meeting
        onOpenSettings={() => setSettingsOpen(true)}
        captureRunning={captureRunning}
        setCaptureRunning={setCaptureRunning}
        lastStats={lastStats}
        setLastStats={setLastStats}
        sessions={sessions}
        setSessions={setSessions}
        keysOk={keysOk}
      />
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
