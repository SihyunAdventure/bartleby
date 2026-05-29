import { lazy, Suspense, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Settings from "./settings/Settings";
import { loadPrefs } from "./settings/prefs";
import Meeting from "./meeting/Meeting";
import { loadSessions, persistSessions } from "./meeting/sessionsStore";
import Onboarding from "./onboarding/Onboarding";
import {
  checkForAppUpdate,
  installUpdateAndRelaunch,
  isUpdateMandatory,
  type UpdateProgress,
} from "./update/updater";
import UpdateModal, { type UpdatePhase } from "./update/UpdateModal";
import type { Update } from "@tauri-apps/plugin-updater";
import { initAnalytics, trackAppOpened } from "./analytics/analytics";
import type { CaptureStats } from "./types/capture";
import type { MeetingSession } from "./meeting/types";
import "./App.css";

const Gallery = lazy(() => import("./gallery/Gallery"));

const params = new URLSearchParams(window.location.search);
const isGallery = params.has("gallery");
// Dev affordance: the updater is disabled in `pnpm dev`, so the only way to
// eyeball the update modal before shipping is a mock. `?update-preview` (or
// `?update-preview=mandatory`) renders it with fake data.
const updatePreview = params.get("update-preview");

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

  // App update flow (see update/UpdateModal). `update` non-null => modal shown.
  const [update, setUpdate] = useState<Update | null>(null);
  const [updatePhase, setUpdatePhase] = useState<UpdatePhase>("prompt");
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const runInstall = (u: Update) => {
    setUpdatePhase("downloading");
    setUpdateError(null);
    setUpdateProgress(null);
    // On success the app relaunches; on failure we surface a retry + manual
    // download fallback rather than trapping the user (critical for a
    // mandatory update — a failed install must never brick the app).
    installUpdateAndRelaunch(u, setUpdateProgress).catch((err) => {
      setUpdateError(String(err));
      setUpdatePhase("error");
    });
  };

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
    if (isGallery || updatePreview !== null) return;
    const id = window.setTimeout(() => {
      void checkForAppUpdate()
        .then((found) => {
          if (!found) return;
          setUpdate(found);
          setUpdatePhase("prompt");
          // A mandatory update starts installing immediately; the blocking
          // modal still renders so the user sees progress and any failure.
          if (isUpdateMandatory(found)) {
            runInstall(found);
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

  if (updatePreview !== null) {
    const previewNotes =
      "### Bartleby 0.2.0\n\n- 새 인앱 업데이트 화면\n- 강제 업데이트 지원\n- 안정성 개선";
    return (
      <UpdateModal
        version="0.2.0"
        notes={previewNotes}
        mandatory={updatePreview === "mandatory"}
        phase={
          updatePreview === "downloading"
            ? "downloading"
            : updatePreview === "error"
              ? "error"
              : "prompt"
        }
        progress={
          updatePreview === "downloading"
            ? { downloadedBytes: 5_200_000, contentLength: 12_000_000, finished: false }
            : null
        }
        errorMsg={updatePreview === "error" ? "network timeout" : null}
        onInstall={() => {}}
        onLater={() => {}}
        onRetry={() => {}}
      />
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
      {update && (
        <UpdateModal
          version={update.version}
          notes={update.body}
          mandatory={isUpdateMandatory(update)}
          phase={updatePhase}
          progress={updateProgress}
          errorMsg={updateError}
          onInstall={() => runInstall(update)}
          onLater={() => setUpdate(null)}
          onRetry={() => runInstall(update)}
        />
      )}
    </main>
  );
}

export default App;
