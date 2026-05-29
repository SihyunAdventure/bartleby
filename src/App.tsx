import { lazy, Suspense, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Settings from "./settings/Settings";
import { loadPrefs } from "./settings/prefs";
import Meeting from "./meeting/Meeting";
import { loadSessions, persistSessions } from "./meeting/sessionsStore";
import Onboarding from "./onboarding/Onboarding";
import { checkForAppUpdate, installUpdateAndRelaunch } from "./update/updater";
import { initAnalytics, trackAppOpened } from "./analytics/analytics";
import type { CaptureStats } from "./types/capture";
import type { MeetingSession } from "./meeting/types";
import "./App.css";

const Gallery = lazy(() => import("./gallery/Gallery"));

const params = new URLSearchParams(window.location.search);
const isGallery = params.has("gallery");

interface KeyStatus {
  present: boolean;
  source: "keychain" | "env" | "file" | null;
}

function App() {
  const [captureRunning, setCaptureRunning] = useState(false);
  const [lastStats, setLastStats] = useState<CaptureStats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [keysMissing, setKeysMissing] = useState(true);
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [sessionsHydrated, setSessionsHydrated] = useState(false);
  const keysOk = !keysMissing;

  // Boot anonymous usage analytics once and record the app launch. No
  // meeting content ever flows through here — see analytics/analytics.ts.
  useEffect(() => {
    initAnalytics().then(() => trackAppOpened());
  }, []);

  // Hydrate sessions from disk once on mount. Until this completes the
  // persist effect below is gated so an initial empty state doesn't
  // overwrite the on-disk store.
  useEffect(() => {
    loadSessions().then((s) => {
      setSessions(s);
      setSessionsHydrated(true);
    });
  }, []);

  // Persist sessions to plugin-store on every change after hydration.
  // Meeting.handleStop also calls persistSessions directly so the JSON
  // file is on disk before navigation happens — this useEffect is the
  // safety net for paths that mutate sessions outside handleStop
  // (e.g. SessionDetail's summary regenerate updates the parent state).
  useEffect(() => {
    if (!sessionsHydrated) return;
    persistSessions(sessions);
  }, [sessions, sessionsHydrated]);

  const refreshKeyStatus = async (): Promise<boolean> => {
    try {
      const prefs = loadPrefs();
      const ready =
        prefs.provider_mode === "hosted"
          ? (await invoke<KeyStatus>("api_key_status", { name: "BARTLEBY_RELAY_TOKEN" })).present
          : (await Promise.all([
              invoke<KeyStatus>("api_key_status", { name: "SONIOX_API_KEY" }),
              invoke<KeyStatus>("api_key_status", { name: "UPSTAGE_API_KEY" }),
            ])).every((status) => status.present);
      setKeysMissing(!ready);
      return ready;
    } catch {
      // Backend down or command unavailable — be conservative in first-run
      // onboarding and show the provider guide until a refresh succeeds.
      setKeysMissing(true);
      return false;
    }
  };

  useEffect(() => {
    const prefs = loadPrefs();
    refreshKeyStatus().then(() => {
      if (!prefs.onboarding_completed) {
        setShowOnboarding(true);
      }
    });
  }, []);

  useEffect(() => {
    if (isGallery) return;
    const id = window.setTimeout(() => {
      void checkForAppUpdate()
        .then((update) => {
          if (!update) return;
          const shouldInstall = window.confirm(
            `Bartleby ${update.version} is ready. Install it now and restart?`,
          );
          if (shouldInstall) {
            void installUpdateAndRelaunch(update);
          }
        })
        .catch((err) => {
          console.warn("[updater] auto-check failed", err);
        });
    }, 2500);
    return () => window.clearTimeout(id);
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
      {showOnboarding && (
        <Onboarding
          keysOk={keysOk}
          onKeysChanged={refreshKeyStatus}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </main>
  );
}

export default App;
