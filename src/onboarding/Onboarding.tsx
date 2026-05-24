import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import KeysTab from "../settings/KeysTab";
import { setPref } from "../settings/prefs";
import styles from "./Onboarding.module.css";

type StepId = "welcome" | "permissions" | "models" | "keys" | "finish";
type PermissionState = "granted" | "not_determined" | "denied" | "restricted" | "unknown";

interface RecordingPermissionStatus {
  microphone: PermissionState;
  screen_recording: PermissionState;
}

interface Props {
  keysOk: boolean;
  onKeysChanged: () => void;
  onClose: () => void;
}

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: "welcome", label: "Start" },
  { id: "permissions", label: "Permissions" },
  { id: "models", label: "Models" },
  { id: "keys", label: "BYOK" },
  { id: "finish", label: "Ready" },
];

const DEFAULT_PERMISSION_STATUS: RecordingPermissionStatus = {
  microphone: "unknown",
  screen_recording: "unknown",
};

export default function Onboarding({ keysOk, onKeysChanged, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [permissions, setPermissions] = useState<RecordingPermissionStatus>(
    DEFAULT_PERMISSION_STATUS,
  );
  const [permissionMessage, setPermissionMessage] = useState("Checking permissions…");
  const [busyPermission, setBusyPermission] = useState<string | null>(null);

  const step = STEPS[stepIndex];
  const permissionsOk =
    permissions.microphone === "granted" && permissions.screen_recording === "granted";

  const refreshPermissions = async () => {
    try {
      const status = await invoke<RecordingPermissionStatus>("recording_permission_status");
      setPermissions(status);
      setPermissionMessage(
        status.microphone === "granted" && status.screen_recording === "granted"
          ? "Recording permissions are ready."
          : "Grant both permissions before recording a meeting.",
      );
    } catch (err) {
      setPermissionMessage(`Could not check permissions: ${String(err)}`);
    }
  };

  useEffect(() => {
    void refreshPermissions();
    const onFocus = () => void refreshPermissions();
    const onVisibility = () => {
      if (!document.hidden) void refreshPermissions();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const finish = () => {
    setPref("onboarding_completed", true);
    onClose();
  };

  const goNext = () => setStepIndex((idx) => Math.min(idx + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((idx) => Math.max(idx - 1, 0));

  const requestPermission = async (
    command: "request_microphone_permission" | "request_screen_recording_permission",
  ) => {
    setBusyPermission(command);
    try {
      const status = await invoke<RecordingPermissionStatus>(command);
      setPermissions(status);
      setPermissionMessage(
        command === "request_microphone_permission"
          ? "Microphone request sent. If it was denied before, open System Settings."
          : "Screen Recording request sent. If macOS opens Settings, enable Bartleby then return here.",
      );
    } catch (err) {
      setPermissionMessage(`Permission request failed: ${String(err)}`);
    } finally {
      setBusyPermission(null);
      window.setTimeout(() => void refreshPermissions(), 800);
    }
  };

  const openSettings = async (
    command: "open_microphone_settings" | "open_screen_recording_settings",
  ) => {
    setBusyPermission(command);
    try {
      await invoke(command);
      setPermissionMessage("System Settings opened. Return to Bartleby after enabling the toggle.");
    } catch (err) {
      setPermissionMessage(`Could not open System Settings: ${String(err)}`);
    } finally {
      setBusyPermission(null);
    }
  };

  const stepBody = useMemo(() => {
    switch (step.id) {
      case "welcome":
        return <WelcomeStep />;
      case "permissions":
        return (
          <PermissionsStep
            permissions={permissions}
            permissionsOk={permissionsOk}
            message={permissionMessage}
            busy={busyPermission}
            onRequestMic={() => void requestPermission("request_microphone_permission")}
            onRequestScreen={() => void requestPermission("request_screen_recording_permission")}
            onOpenMicSettings={() => void openSettings("open_microphone_settings")}
            onOpenScreenSettings={() => void openSettings("open_screen_recording_settings")}
            onRefresh={() => void refreshPermissions()}
          />
        );
      case "models":
        return <ModelsStep />;
      case "keys":
        return <KeysStep keysOk={keysOk} onKeysChanged={onKeysChanged} />;
      case "finish":
        return <FinishStep keysOk={keysOk} permissionsOk={permissionsOk} />;
    }
  }, [
    step.id,
    permissions,
    permissionsOk,
    permissionMessage,
    busyPermission,
    keysOk,
    onKeysChanged,
  ]);

  return (
    <div className={styles.backdrop}>
      <section className={styles.sheet} aria-labelledby="onboarding-title">
        <aside className={styles.rail} aria-label="Onboarding steps">
          <div className={styles.brand}>Bartleby</div>
          <ol className={styles.steps}>
            {STEPS.map((item, idx) => (
              <li key={item.id}>
                <button
                  className={`${styles.stepButton} ${idx === stepIndex ? styles.stepActive : ""} ${
                    idx < stepIndex ? styles.stepDone : ""
                  }`}
                  onClick={() => setStepIndex(idx)}
                >
                  <span>{String(idx + 1).padStart(2, "0")}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ol>
          <p className={styles.railNote}>
            Same release posture as Copy & Taste: finish first-run setup, then update from the release feed.
          </p>
        </aside>

        <main className={styles.content}>
          <div className={styles.kicker}>first install checklist</div>
          {stepBody}

          <footer className={styles.footer}>
            <button className="btn" onClick={finish}>
              Skip for now
            </button>
            <div className={styles.navButtons}>
              <button className="btn" onClick={goBack} disabled={stepIndex === 0}>
                Back
              </button>
              {stepIndex === STEPS.length - 1 ? (
                <button className="btn btn-primary" onClick={finish}>
                  Start using Bartleby
                </button>
              ) : (
                <button className="btn btn-primary" onClick={goNext}>
                  Continue
                </button>
              )}
            </div>
          </footer>
        </main>
      </section>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className={styles.stepPanel}>
      <h1 id="onboarding-title" className={styles.title}>
        Set up meeting capture in four calm steps.
      </h1>
      <p className={styles.lede}>
        Bartleby stores audio and notes on your Mac, then calls Soniox and Upstage directly with your own keys. No bundled local LLM, no OpenRouter, no hidden Gemini or Whisper path.
      </p>
      <div className={styles.summaryGrid}>
        <SummaryCard title="1 · Permissions" body="Microphone and Screen Recording are requested one by one, with System Settings links if macOS needs a manual toggle." />
        <SummaryCard title="2 · Models" body="There is nothing heavy to download. Bartleby pins Soniox stt-rt-v4 and Upstage solar-pro3 for this release." />
        <SummaryCard title="3 · BYOK" body="Paste and verify Soniox/Upstage keys. They are stored through the existing macOS Keychain flow." />
        <SummaryCard title="4 · Updates" body="The DMG build can check heybartleby.com/latest.json and install signed updates automatically." />
      </div>
    </div>
  );
}

function PermissionsStep({
  permissions,
  permissionsOk,
  message,
  busy,
  onRequestMic,
  onRequestScreen,
  onOpenMicSettings,
  onOpenScreenSettings,
  onRefresh,
}: {
  permissions: RecordingPermissionStatus;
  permissionsOk: boolean;
  message: string;
  busy: string | null;
  onRequestMic: () => void;
  onRequestScreen: () => void;
  onOpenMicSettings: () => void;
  onOpenScreenSettings: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className={styles.stepPanel}>
      <h1 className={styles.title}>Grant recording permissions step by step.</h1>
      <p className={styles.lede}>
        macOS only shows each prompt from the installed app bundle. If a prompt was denied before, the Settings button opens the exact privacy pane.
      </p>

      <div className={styles.permissionList}>
        <PermissionRow
          title="Microphone"
          status={permissions.microphone}
          body="Required to capture your side of the meeting. Without it, cpal receives silence."
          requestLabel="Request Microphone"
          settingsLabel="Open Microphone Settings"
          busy={busy === "request_microphone_permission" || busy === "open_microphone_settings"}
          onRequest={onRequestMic}
          onOpenSettings={onOpenMicSettings}
        />
        <PermissionRow
          title="Screen Recording / System Audio"
          status={permissions.screen_recording}
          body="Required for ScreenCaptureKit system audio. Bartleby captures a tiny placeholder video frame only to unlock system audio capture."
          requestLabel="Request Screen Recording"
          settingsLabel="Open Screen Recording Settings"
          busy={busy === "request_screen_recording_permission" || busy === "open_screen_recording_settings"}
          onRequest={onRequestScreen}
          onOpenSettings={onOpenScreenSettings}
        />
      </div>

      <div className={`${styles.notice} ${permissionsOk ? styles.noticeReady : ""}`}>
        <span>{permissionsOk ? "✓" : "○"}</span>
        <p>{message}</p>
        <button className="btn" onClick={onRefresh}>Recheck</button>
      </div>
    </div>
  );
}

function ModelsStep() {
  return (
    <div className={styles.stepPanel}>
      <h1 className={styles.title}>Model setup is automatic in this release.</h1>
      <p className={styles.lede}>
        To avoid local storage bloat and user confusion, Bartleby does not install local LLM/STT files on first launch. The “install” step is simply making the provider routes explicit and ready.
      </p>
      <div className={styles.modelGrid}>
        <ProviderCard
          step="STT"
          provider="Soniox"
          model="stt-rt-v4"
          required="Required for realtime transcript"
          body="Streams mic + system audio chunks directly to Soniox. Two STT sessions keep system and microphone endpointing separate."
          primaryHref="https://soniox.com/"
          secondaryHref="https://soniox.com/pricing"
          primaryLabel="Get Soniox key"
          secondaryLabel="Pricing"
        />
        <ProviderCard
          step="LLM"
          provider="Upstage"
          model="solar-pro3"
          required="Required for Korean notes"
          body="Generates Korean translation, TL;DR, outline, one-pager, quote, and final meeting summary through Upstage direct API."
          primaryHref="https://console.upstage.ai/"
          secondaryHref="https://www.upstage.ai/pricing"
          primaryLabel="Get Upstage key"
          secondaryLabel="Pricing"
        />
      </div>
      <div className={styles.costBox}>
        <span className={styles.costTitle}>No local model download</span>
        <p>
          There are no hidden Ollama, Whisper, Gemini, OpenRouter, or bundled open-source models in this build. Users only need network access and their own Soniox/Upstage keys.
        </p>
      </div>
    </div>
  );
}

function KeysStep({ keysOk, onKeysChanged }: { keysOk: boolean; onKeysChanged: () => void }) {
  return (
    <div className={styles.stepPanel}>
      <h1 className={styles.title}>Bring your own keys.</h1>
      <p className={styles.lede}>
        Verify each key before saving. Bartleby stores secrets in macOS Keychain and falls back to environment variables only for development launches.
      </p>
      <div className={styles.keysPanel}>
        <div className={styles.keysHeader}>
          <span className={styles.keysTitle}>Connect providers</span>
          <span className={`${styles.status} ${keysOk ? styles.ready : styles.missing}`}>
            {keysOk ? "ready" : "keys needed"}
          </span>
        </div>
        <KeysTab onChanged={onKeysChanged} />
      </div>
    </div>
  );
}

function FinishStep({ keysOk, permissionsOk }: { keysOk: boolean; permissionsOk: boolean }) {
  return (
    <div className={styles.stepPanel}>
      <h1 className={styles.title}>Bartleby is ready enough to ship.</h1>
      <p className={styles.lede}>
        You can revisit keys and storage from Settings. Recording is best after both macOS permissions are granted and both BYOK providers are saved.
      </p>
      <div className={styles.finishList}>
        <CheckLine ok={permissionsOk} label="Recording permissions" detail="Microphone + Screen Recording" />
        <CheckLine ok={keysOk} label="Provider keys" detail="Soniox + Upstage in Keychain or env" />
        <CheckLine ok label="Model routing" detail="Soniox stt-rt-v4 + Upstage solar-pro3" />
        <CheckLine ok label="Updates" detail="Signed Tauri updater feed configured" />
      </div>
    </div>
  );
}

function SummaryCard({ title, body }: { title: string; body: string }) {
  return (
    <article className={styles.summaryCard}>
      <h2>{title}</h2>
      <p>{body}</p>
    </article>
  );
}

function PermissionRow({
  title,
  status,
  body,
  requestLabel,
  settingsLabel,
  busy,
  onRequest,
  onOpenSettings,
}: {
  title: string;
  status: PermissionState;
  body: string;
  requestLabel: string;
  settingsLabel: string;
  busy: boolean;
  onRequest: () => void;
  onOpenSettings: () => void;
}) {
  const granted = status === "granted";
  return (
    <article className={styles.permissionRow}>
      <div className={styles.permissionCopy}>
        <div className={styles.permissionTopline}>
          <h2>{title}</h2>
          <span className={`${styles.status} ${granted ? styles.ready : styles.missing}`}>
            {permissionLabel(status)}
          </span>
        </div>
        <p>{body}</p>
      </div>
      <div className={styles.permissionActions}>
        <button className="btn" onClick={onRequest} disabled={busy || granted}>
          {busy ? "Working…" : requestLabel}
        </button>
        <button className="btn" onClick={onOpenSettings} disabled={busy || granted}>
          {settingsLabel}
        </button>
      </div>
    </article>
  );
}

function CheckLine({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className={styles.checkLine}>
      <span className={`${styles.checkDot} ${ok ? styles.checkOk : ""}`}>{ok ? "✓" : "○"}</span>
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function permissionLabel(status: PermissionState): string {
  switch (status) {
    case "granted":
      return "allowed";
    case "denied":
      return "denied";
    case "restricted":
      return "restricted";
    case "not_determined":
      return "not asked";
    default:
      return "unknown";
  }
}

interface ProviderCardProps {
  step: string;
  provider: string;
  model: string;
  required: string;
  body: string;
  primaryHref: string;
  secondaryHref: string;
  primaryLabel: string;
  secondaryLabel: string;
}

function ProviderCard({
  step,
  provider,
  model,
  required,
  body,
  primaryHref,
  secondaryHref,
  primaryLabel,
  secondaryLabel,
}: ProviderCardProps) {
  return (
    <article className={styles.providerCard}>
      <div className={styles.providerTop}>
        <span className={styles.stepTag}>{step}</span>
        <span className={styles.required}>{required}</span>
      </div>
      <h2 className={styles.provider}>{provider}</h2>
      <p className={styles.model}>Model: {model}</p>
      <p className={styles.providerBody}>{body}</p>
      <div className={styles.links}>
        <a href={primaryHref} target="_blank" rel="noreferrer">
          {primaryLabel}
        </a>
        <a href={secondaryHref} target="_blank" rel="noreferrer">
          {secondaryLabel}
        </a>
      </div>
    </article>
  );
}
