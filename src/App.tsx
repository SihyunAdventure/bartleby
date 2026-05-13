import { lazy, Suspense, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Settings from "./settings/Settings";
import Meeting from "./meeting/Meeting";
import type { CaptureStats } from "./types/capture";
import type { MeetingSession } from "./meeting/types";
import "./App.css";

const SESSIONS_STORAGE_KEY_V1 = "bartleby.sessions.v1";
const SESSIONS_STORAGE_KEY = "bartleby.sessions.v2";

// Phase 5 S3 — v2 introduces an optional `finalSummary` field. Old v1
// sessions get hydrated without it; SessionDetail surfaces a "Regenerate"
// button when finalSummary is absent. v1 key is consumed once and cleared.
function loadSessions(): MeetingSession[] {
  try {
    const rawV2 = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const rawV1 = localStorage.getItem(SESSIONS_STORAGE_KEY_V1);
    const raw = rawV2 ?? rawV1;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<
      Omit<MeetingSession, "startedAt" | "endedAt"> & {
        startedAt: string;
        endedAt: string;
      }
    >;
    const hydrated = parsed.map((s) => ({
      ...s,
      startedAt: new Date(s.startedAt),
      endedAt: new Date(s.endedAt),
      transcript: s.transcript ?? [],
    }));
    // Migrate v1 → v2 once and retire the old key.
    if (!rawV2 && rawV1) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(hydrated));
      localStorage.removeItem(SESSIONS_STORAGE_KEY_V1);
    }
    return hydrated;
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
