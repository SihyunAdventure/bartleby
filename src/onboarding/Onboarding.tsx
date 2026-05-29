import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import KeysTab from "../settings/KeysTab";
import { loadPrefs, setPref, type AppLanguage } from "../settings/prefs";
import { trackOnboardingCompleted } from "../analytics/analytics";
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

const DEFAULT_PERMISSION_STATUS: RecordingPermissionStatus = {
  microphone: "unknown",
  screen_recording: "unknown",
};

type OnboardingCopy = {
  steps: Record<StepId, string>;
  railLabel: string;
  railNote: string;
  kicker: string;
  finishLater: string;
  back: string;
  continue: string;
  start: string;
  startDisabledTitle: string;
  checkingPermissions: string;
  permissionsReady: string;
  permissionsNeeded: string;
  checkFailed: (err: string) => string;
  micRequestSent: string;
  screenRequestSent: string;
  permissionRequestFailed: (err: string) => string;
  settingsOpened: string;
  settingsOpenFailed: (err: string) => string;
  welcome: {
    title: string;
    lede: string;
    cards: Array<{ title: string; body: string }>;
  };
  permissions: {
    title: string;
    lede: string;
    micTitle: string;
    micBody: string;
    micRequest: string;
    micSettings: string;
    screenTitle: string;
    screenBody: string;
    screenRequest: string;
    screenSettings: string;
    recheck: string;
    working: string;
    labels: Record<PermissionState, string>;
  };
  models: {
    title: string;
    lede: string;
    sttRequired: string;
    sttBody: string;
    llmRequired: string;
    llmBody: string;
    modelPrefix: string;
    sonioxLink: string;
    upstageLink: string;
    pricing: string;
    costTitle: string;
    costBody: string;
  };
  keys: {
    title: string;
    lede: string;
    connectTitle: string;
    ready: string;
    missing: string;
  };
  finish: {
    title: string;
    lede: string;
    permissionsLabel: string;
    permissionsDetail: string;
    accessLabel: string;
    hostedDetail: string;
    byokDetail: string;
    routingLabel: string;
    routingDetail: string;
    updatesLabel: string;
    updatesDetail: string;
    privacyLabel: string;
    privacyDetail: string;
  };
};

const COPY: Record<AppLanguage, OnboardingCopy> = {
  ko: {
    steps: {
      welcome: "시작",
      permissions: "권한",
      models: "모델",
      keys: "접속 키",
      finish: "완료",
    },
    railLabel: "온보딩 단계",
    railNote:
      "Copy & Taste처럼 첫 실행 체크리스트를 끝내고, 이후에는 서명된 업데이트 피드로 자동 업데이트합니다.",
    kicker: "첫 설치 체크리스트",
    finishLater: "나중에 마치기",
    back: "이전",
    continue: "계속",
    start: "Bartleby 시작하기",
    startDisabledTitle: "녹음 권한을 허용하고 Hosted/BYOK 접속을 먼저 연결해 주세요.",
    checkingPermissions: "권한 상태를 확인하는 중…",
    permissionsReady: "녹음 권한이 준비됐습니다.",
    permissionsNeeded: "회의를 녹음하려면 두 권한을 모두 허용해야 합니다.",
    checkFailed: (err) => `권한 상태를 확인하지 못했습니다: ${err}`,
    micRequestSent: "마이크 권한 요청을 보냈습니다. 이전에 거부했다면 시스템 설정을 열어 주세요.",
    screenRequestSent:
      "화면 기록 권한 요청을 보냈습니다. macOS 설정이 열리면 Bartleby를 켠 뒤 돌아와 주세요.",
    permissionRequestFailed: (err) => `권한 요청에 실패했습니다: ${err}`,
    settingsOpened: "시스템 설정을 열었습니다. 토글을 켠 뒤 Bartleby로 돌아와 주세요.",
    settingsOpenFailed: (err) => `시스템 설정을 열지 못했습니다: ${err}`,
    welcome: {
      title: "회의 녹음을 네 단계로 차분하게 설정합니다.",
      lede:
        "Bartleby는 오디오와 회의록을 Mac에 저장합니다. 지인 베타는 Bartleby hosted 토큰을 쓰고, 직접 결제/감사 경계가 필요하면 Soniox/Upstage BYOK로 전환할 수 있어요. 로컬 LLM, OpenRouter, Gemini, Whisper 경로는 숨겨 넣지 않았습니다.",
      cards: [
        {
          title: "1 · 권한",
          body: "마이크와 화면 기록 권한을 하나씩 요청합니다. macOS에서 수동 토글이 필요하면 바로 시스템 설정으로 이동합니다.",
        },
        {
          title: "2 · 모델",
          body: "무거운 모델 다운로드가 없습니다. 이번 릴리스는 Soniox stt-rt-v4와 Upstage solar-pro3만 고정해 사용합니다.",
        },
        {
          title: "3 · 접속",
          body: "기본은 Bartleby hosted 베타 토큰입니다. 원하면 BYOK로 Soniox/Upstage 키를 직접 넣고, 비밀값은 macOS Keychain에 저장합니다.",
        },
        {
          title: "4 · 업데이트",
          body: "DMG 빌드는 heybartleby.com/latest.json을 확인하고 서명된 업데이트를 자동 설치할 수 있습니다.",
        },
      ],
    },
    permissions: {
      title: "녹음 권한을 단계별로 허용해 주세요.",
      lede:
        "macOS 권한 프롬프트는 설치된 앱 번들에서만 제대로 뜹니다. 이전에 거부했다면 설정 버튼이 해당 개인정보 보호 화면을 바로 엽니다.",
      micTitle: "마이크",
      micBody: "내 목소리를 녹음하는 데 필요합니다. 이 권한이 없으면 마이크 입력은 무음으로 들어옵니다.",
      micRequest: "마이크 권한 요청",
      micSettings: "마이크 설정 열기",
      screenTitle: "화면 기록 / 시스템 오디오",
      screenBody:
        "ScreenCaptureKit 시스템 오디오 캡처에 필요합니다. Bartleby는 시스템 오디오 권한을 열기 위해 아주 작은 placeholder 비디오 프레임만 캡처합니다.",
      screenRequest: "화면 기록 권한 요청",
      screenSettings: "화면 기록 설정 열기",
      recheck: "다시 확인",
      working: "처리 중…",
      labels: {
        granted: "허용됨",
        denied: "거부됨",
        restricted: "제한됨",
        not_determined: "아직 안 물어봄",
        unknown: "알 수 없음",
      },
    },
    models: {
      title: "이번 릴리스의 모델 설정은 자동입니다.",
      lede:
        "로컬 용량 증가와 사용자 혼란을 막기 위해 첫 실행 때 LLM/STT 파일을 설치하지 않습니다. Hosted 모드는 Bartleby relay를 쓰고, BYOK 모드는 같은 제공자에 직접 호출합니다.",
      sttRequired: "실시간 회의록 필수",
      sttBody:
        "마이크와 시스템 오디오 chunk를 Soniox stt-rt-v4로 스트리밍합니다. Hosted relay 또는 BYOK 직접 호출 모두 같은 모델을 사용하며, 시스템/마이크 endpointing을 분리하기 위해 두 세션을 씁니다.",
      llmRequired: "한국어 노트 필수",
      llmBody:
        "Upstage Solar Pro 3가 TL;DR, outline, one-pager, quote, final note를 생성합니다. Hosted relay 또는 BYOK 직접 호출로만 동작합니다.",
      modelPrefix: "모델",
      sonioxLink: "Soniox 키 받기",
      upstageLink: "Upstage 키 받기",
      pricing: "가격 보기",
      costTitle: "로컬 모델 다운로드 없음",
      costBody:
        "이 빌드에는 Ollama, Whisper, Gemini, OpenRouter, 번들 오픈소스 모델이 숨어 있지 않습니다. 사용자는 네트워크 연결과 Bartleby relay 토큰 또는 본인 Soniox/Upstage 키만 있으면 됩니다.",
    },
    keys: {
      title: "Hosted 접속 또는 BYOK를 선택하세요.",
      lede:
        "지인 베타는 Bartleby hosted 토큰을 쓰면 됩니다. 직접 비용/키를 관리하고 싶다면 BYOK로 Soniox/Upstage 키를 검증하세요. 모든 키는 macOS Keychain에 저장됩니다.",
      connectTitle: "접속 연결",
      ready: "준비됨",
      missing: "토큰 또는 키 필요",
    },
    finish: {
      title: "이제 Bartleby를 사용할 준비가 됐습니다.",
      lede:
        "접속 방식, 제공자 키, 저장 정책은 언제든 Settings에서 다시 바꿀 수 있습니다. 녹음은 macOS 권한과 제공자 접속이 모두 준비됐을 때 가장 안정적입니다.",
      permissionsLabel: "녹음 권한",
      permissionsDetail: "마이크 + 화면 기록",
      accessLabel: "제공자 접속",
      hostedDetail: "Keychain 또는 환경 변수의 Bartleby hosted 토큰",
      byokDetail: "Keychain 또는 환경 변수의 Soniox + Upstage 키",
      routingLabel: "모델 라우팅",
      routingDetail: "Soniox stt-rt-v4 + Upstage solar-pro3",
      updatesLabel: "업데이트",
      updatesDetail: "서명된 Tauri updater feed 설정 완료",
      privacyLabel: "사용 통계",
      privacyDetail: "익명 이벤트만 수집 · 회의 내용은 절대 미전송 · Settings에서 끄기 가능",
    },
  },
  en: {
    steps: {
      welcome: "Start",
      permissions: "Permissions",
      models: "Models",
      keys: "Access",
      finish: "Ready",
    },
    railLabel: "Onboarding steps",
    railNote:
      "Same release posture as Copy & Taste: finish first-run setup, then update from the signed release feed.",
    kicker: "first install checklist",
    finishLater: "Finish later",
    back: "Back",
    continue: "Continue",
    start: "Start using Bartleby",
    startDisabledTitle: "Grant recording permissions and connect hosted/BYOK access first.",
    checkingPermissions: "Checking permissions…",
    permissionsReady: "Recording permissions are ready.",
    permissionsNeeded: "Grant both permissions before recording a meeting.",
    checkFailed: (err) => `Could not check permissions: ${err}`,
    micRequestSent: "Microphone request sent. If it was denied before, open System Settings.",
    screenRequestSent:
      "Screen Recording request sent. If macOS opens Settings, enable Bartleby then return here.",
    permissionRequestFailed: (err) => `Permission request failed: ${err}`,
    settingsOpened: "System Settings opened. Return to Bartleby after enabling the toggle.",
    settingsOpenFailed: (err) => `Could not open System Settings: ${err}`,
    welcome: {
      title: "Set up meeting capture in four calm steps.",
      lede:
        "Bartleby stores audio and notes on your Mac. Friends beta can use a hosted Bartleby relay token; advanced users can switch to direct Soniox/Upstage BYOK. No bundled local LLM, no OpenRouter, no hidden Gemini or Whisper path.",
      cards: [
        {
          title: "1 · Permissions",
          body: "Microphone and Screen Recording are requested one by one, with System Settings links if macOS needs a manual toggle.",
        },
        {
          title: "2 · Models",
          body: "There is nothing heavy to download. Bartleby pins Soniox stt-rt-v4 and Upstage solar-pro3 for this release.",
        },
        {
          title: "3 · Access",
          body: "Default to a Bartleby hosted beta token, or switch to BYOK for direct Soniox/Upstage billing. Secrets are stored in macOS Keychain.",
        },
        {
          title: "4 · Updates",
          body: "The DMG build can check heybartleby.com/latest.json and install signed updates automatically.",
        },
      ],
    },
    permissions: {
      title: "Grant recording permissions step by step.",
      lede:
        "macOS only shows each prompt from the installed app bundle. If a prompt was denied before, the Settings button opens the exact privacy pane.",
      micTitle: "Microphone",
      micBody: "Required to capture your side of the meeting. Without it, cpal receives silence.",
      micRequest: "Request Microphone",
      micSettings: "Open Microphone Settings",
      screenTitle: "Screen Recording / System Audio",
      screenBody:
        "Required for ScreenCaptureKit system audio. Bartleby captures a tiny placeholder video frame only to unlock system audio capture.",
      screenRequest: "Request Screen Recording",
      screenSettings: "Open Screen Recording Settings",
      recheck: "Recheck",
      working: "Working…",
      labels: {
        granted: "allowed",
        denied: "denied",
        restricted: "restricted",
        not_determined: "not asked",
        unknown: "unknown",
      },
    },
    models: {
      title: "Model setup is automatic in this release.",
      lede:
        "To avoid local storage bloat and user confusion, Bartleby does not install local LLM/STT files on first launch. Hosted mode uses the Bartleby relay; BYOK mode calls the same providers directly.",
      sttRequired: "Required for realtime transcript",
      sttBody:
        "Streams mic + system audio chunks to Soniox stt-rt-v4, either through the hosted relay or directly in BYOK mode. Two sessions keep system and microphone endpointing separate.",
      llmRequired: "Required for Korean notes",
      llmBody:
        "Generates TL;DR, outline, one-pager, quote, and final note through Upstage Solar Pro 3 via hosted relay or direct BYOK.",
      modelPrefix: "Model",
      sonioxLink: "Get Soniox key",
      upstageLink: "Get Upstage key",
      pricing: "Pricing",
      costTitle: "No local model download",
      costBody:
        "There are no hidden Ollama, Whisper, Gemini, OpenRouter, or bundled open-source models in this build. Users only need network access plus either a Bartleby relay token or their own Soniox/Upstage keys.",
    },
    keys: {
      title: "Choose hosted access or BYOK.",
      lede:
        "Friends beta should use the Bartleby hosted token. Power users can switch to BYOK and verify Soniox/Upstage keys directly. Everything is stored in macOS Keychain.",
      connectTitle: "Connect access",
      ready: "ready",
      missing: "token or keys needed",
    },
    finish: {
      title: "Bartleby is ready enough to ship.",
      lede:
        "You can revisit access, provider keys, and storage from Settings. Recording is best after macOS permissions are granted and provider access is ready.",
      permissionsLabel: "Recording permissions",
      permissionsDetail: "Microphone + Screen Recording",
      accessLabel: "Provider access",
      hostedDetail: "Bartleby hosted token in Keychain or env",
      byokDetail: "Soniox + Upstage in Keychain or env",
      routingLabel: "Model routing",
      routingDetail: "Soniox stt-rt-v4 + Upstage solar-pro3",
      updatesLabel: "Updates",
      updatesDetail: "Signed Tauri updater feed configured",
      privacyLabel: "Usage analytics",
      privacyDetail: "Anonymous events only · meeting content never sent · turn off in Settings",
    },
  },
};

const STEP_IDS: StepId[] = ["welcome", "permissions", "models", "keys", "finish"];

export default function Onboarding({ keysOk, onKeysChanged, onClose }: Props) {
  const [language, setLanguage] = useState<AppLanguage>(() => loadPrefs().onboarding_language);
  const copy = COPY[language];
  const steps = useMemo(
    () => STEP_IDS.map((id) => ({ id, label: copy.steps[id] })),
    [copy],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [permissions, setPermissions] = useState<RecordingPermissionStatus>(
    DEFAULT_PERMISSION_STATUS,
  );
  const [permissionMessage, setPermissionMessage] = useState(copy.checkingPermissions);
  const [busyPermission, setBusyPermission] = useState<string | null>(null);

  const step = steps[stepIndex];
  const permissionsOk =
    permissions.microphone === "granted" && permissions.screen_recording === "granted";

  const refreshPermissions = async () => {
    try {
      const status = await invoke<RecordingPermissionStatus>("recording_permission_status");
      setPermissions(status);
      setPermissionMessage(permissionsReady(status, copy));
    } catch (err) {
      setPermissionMessage(copy.checkFailed(String(err)));
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
  }, [language]);

  const finish = () => {
    setPref("onboarding_completed", true);
    trackOnboardingCompleted(language);
    onClose();
  };

  const chooseLanguage = (next: AppLanguage) => {
    setLanguage(next);
    setPref("onboarding_language", next);
    setPermissionMessage(permissionsReady(permissions, COPY[next]));
  };

  const canStart = permissionsOk && keysOk;

  const goNext = () => setStepIndex((idx) => Math.min(idx + 1, steps.length - 1));
  const goBack = () => setStepIndex((idx) => Math.max(idx - 1, 0));

  const requestPermission = async (
    command: "request_microphone_permission" | "request_screen_recording_permission",
  ) => {
    setBusyPermission(command);
    try {
      const status = await invoke<RecordingPermissionStatus>(command);
      setPermissions(status);
      setPermissionMessage(
        command === "request_microphone_permission" ? copy.micRequestSent : copy.screenRequestSent,
      );
    } catch (err) {
      setPermissionMessage(copy.permissionRequestFailed(String(err)));
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
      setPermissionMessage(copy.settingsOpened);
    } catch (err) {
      setPermissionMessage(copy.settingsOpenFailed(String(err)));
    } finally {
      setBusyPermission(null);
    }
  };

  const stepBody = useMemo(() => {
    switch (step.id) {
      case "welcome":
        return <WelcomeStep copy={copy} />;
      case "permissions":
        return (
          <PermissionsStep
            copy={copy}
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
        return <ModelsStep copy={copy} />;
      case "keys":
        return <KeysStep copy={copy} language={language} keysOk={keysOk} onKeysChanged={onKeysChanged} />;
      case "finish":
        return <FinishStep copy={copy} keysOk={keysOk} permissionsOk={permissionsOk} />;
    }
  }, [
    step.id,
    copy,
    language,
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
        <aside className={styles.rail} aria-label={copy.railLabel}>
          <div className={styles.brandRow}>
            <div className={styles.brand}>Bartleby</div>
            <div className={styles.languageSwitch} aria-label="Language">
              <button
                type="button"
                className={`${styles.languageButton} ${language === "ko" ? styles.languageActive : ""}`}
                onClick={() => chooseLanguage("ko")}
              >
                한국어
              </button>
              <button
                type="button"
                className={`${styles.languageButton} ${language === "en" ? styles.languageActive : ""}`}
                onClick={() => chooseLanguage("en")}
              >
                EN
              </button>
            </div>
          </div>
          <ol className={styles.steps}>
            {steps.map((item, idx) => (
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
          <p className={styles.railNote}>{copy.railNote}</p>
        </aside>

        <main className={styles.content}>
          <div className={styles.kicker}>{copy.kicker}</div>
          {stepBody}

          <footer className={styles.footer}>
            <button className="btn" onClick={finish}>
              {copy.finishLater}
            </button>
            <div className={styles.navButtons}>
              <button className="btn" onClick={goBack} disabled={stepIndex === 0}>
                {copy.back}
              </button>
              {stepIndex === steps.length - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={finish}
                  disabled={!canStart}
                  title={!canStart ? copy.startDisabledTitle : undefined}
                >
                  {copy.start}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={goNext}>
                  {copy.continue}
                </button>
              )}
            </div>
          </footer>
        </main>
      </section>
    </div>
  );
}

function permissionsReady(status: RecordingPermissionStatus, copy: OnboardingCopy): string {
  return status.microphone === "granted" && status.screen_recording === "granted"
    ? copy.permissionsReady
    : copy.permissionsNeeded;
}

function WelcomeStep({ copy }: { copy: OnboardingCopy }) {
  return (
    <div className={styles.stepPanel}>
      <h1 id="onboarding-title" className={styles.title}>
        {copy.welcome.title}
      </h1>
      <p className={styles.lede}>{copy.welcome.lede}</p>
      <div className={styles.summaryGrid}>
        {copy.welcome.cards.map((card) => (
          <SummaryCard key={card.title} title={card.title} body={card.body} />
        ))}
      </div>
    </div>
  );
}

function PermissionsStep({
  copy,
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
  copy: OnboardingCopy;
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
      <h1 className={styles.title}>{copy.permissions.title}</h1>
      <p className={styles.lede}>{copy.permissions.lede}</p>

      <div className={styles.permissionList}>
        <PermissionRow
          copy={copy}
          title={copy.permissions.micTitle}
          status={permissions.microphone}
          body={copy.permissions.micBody}
          requestLabel={copy.permissions.micRequest}
          settingsLabel={copy.permissions.micSettings}
          busy={busy === "request_microphone_permission" || busy === "open_microphone_settings"}
          onRequest={onRequestMic}
          onOpenSettings={onOpenMicSettings}
        />
        <PermissionRow
          copy={copy}
          title={copy.permissions.screenTitle}
          status={permissions.screen_recording}
          body={copy.permissions.screenBody}
          requestLabel={copy.permissions.screenRequest}
          settingsLabel={copy.permissions.screenSettings}
          busy={busy === "request_screen_recording_permission" || busy === "open_screen_recording_settings"}
          onRequest={onRequestScreen}
          onOpenSettings={onOpenScreenSettings}
        />
      </div>

      <div className={`${styles.notice} ${permissionsOk ? styles.noticeReady : ""}`}>
        <span>{permissionsOk ? "✓" : "○"}</span>
        <p>{message}</p>
        <button className="btn" onClick={onRefresh}>{copy.permissions.recheck}</button>
      </div>
    </div>
  );
}

function ModelsStep({ copy }: { copy: OnboardingCopy }) {
  return (
    <div className={styles.stepPanel}>
      <h1 className={styles.title}>{copy.models.title}</h1>
      <p className={styles.lede}>{copy.models.lede}</p>
      <div className={styles.modelGrid}>
        <ProviderCard
          copy={copy}
          step="STT"
          provider="Soniox"
          model="stt-rt-v4"
          required={copy.models.sttRequired}
          body={copy.models.sttBody}
          primaryHref="https://soniox.com/"
          secondaryHref="https://soniox.com/pricing"
          primaryLabel={copy.models.sonioxLink}
          secondaryLabel={copy.models.pricing}
        />
        <ProviderCard
          copy={copy}
          step="LLM"
          provider="Upstage"
          model="solar-pro3"
          required={copy.models.llmRequired}
          body={copy.models.llmBody}
          primaryHref="https://console.upstage.ai/"
          secondaryHref="https://www.upstage.ai/pricing"
          primaryLabel={copy.models.upstageLink}
          secondaryLabel={copy.models.pricing}
        />
      </div>
      <div className={styles.costBox}>
        <span className={styles.costTitle}>{copy.models.costTitle}</span>
        <p>{copy.models.costBody}</p>
      </div>
    </div>
  );
}

function KeysStep({
  copy,
  language,
  keysOk,
  onKeysChanged,
}: {
  copy: OnboardingCopy;
  language: AppLanguage;
  keysOk: boolean;
  onKeysChanged: () => void;
}) {
  return (
    <div className={styles.stepPanel}>
      <h1 className={styles.title}>{copy.keys.title}</h1>
      <p className={styles.lede}>{copy.keys.lede}</p>
      <div className={styles.keysPanel}>
        <div className={styles.keysHeader}>
          <span className={styles.keysTitle}>{copy.keys.connectTitle}</span>
          <span className={`${styles.status} ${keysOk ? styles.ready : styles.missing}`}>
            {keysOk ? copy.keys.ready : copy.keys.missing}
          </span>
        </div>
        <KeysTab language={language} onChanged={onKeysChanged} />
      </div>
    </div>
  );
}

function FinishStep({ copy, keysOk, permissionsOk }: { copy: OnboardingCopy; keysOk: boolean; permissionsOk: boolean }) {
  return (
    <div className={styles.stepPanel}>
      <h1 className={styles.title}>{copy.finish.title}</h1>
      <p className={styles.lede}>{copy.finish.lede}</p>
      <div className={styles.finishList}>
        <CheckLine ok={permissionsOk} label={copy.finish.permissionsLabel} detail={copy.finish.permissionsDetail} />
        <CheckLine ok={keysOk} label={copy.finish.accessLabel} detail={loadPrefs().provider_mode === "hosted" ? copy.finish.hostedDetail : copy.finish.byokDetail} />
        <CheckLine ok label={copy.finish.routingLabel} detail={copy.finish.routingDetail} />
        <CheckLine ok label={copy.finish.updatesLabel} detail={copy.finish.updatesDetail} />
        <CheckLine ok label={copy.finish.privacyLabel} detail={copy.finish.privacyDetail} />
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
  copy,
  title,
  status,
  body,
  requestLabel,
  settingsLabel,
  busy,
  onRequest,
  onOpenSettings,
}: {
  copy: OnboardingCopy;
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
            {copy.permissions.labels[status]}
          </span>
        </div>
        <p>{body}</p>
      </div>
      <div className={styles.permissionActions}>
        <button className="btn" onClick={onRequest} disabled={busy || granted}>
          {busy ? copy.permissions.working : requestLabel}
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

interface ProviderCardProps {
  copy: OnboardingCopy;
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
  copy,
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
      <p className={styles.model}>{copy.models.modelPrefix}: {model}</p>
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
