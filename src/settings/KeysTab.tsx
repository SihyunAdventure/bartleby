import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import KeyInput from "../components/KeyInput";
import { loadPrefs, setPref, type AppLanguage, type ProviderMode } from "./prefs";
import styles from "./KeysTab.module.css";

interface KeyStatus {
  present: boolean;
  source: "keychain" | "env" | "file" | null;
}

interface Props {
  onChanged: () => void;
  language?: AppLanguage;
}

const EMPTY_STATUS: KeyStatus = { present: false, source: null };

const COPY = {
  ko: {
    aria: "제공자 접속 방식",
    hostedTitle: "Hosted 베타",
    hostedBadge: "추천",
    hostedBody: "Bartleby relay 토큰을 사용합니다. 지인 테스트 동안 Notique가 Soniox + Upstage 비용을 부담합니다.",
    byokTitle: "BYOK",
    byokBadge: "고급",
    byokBody: "이 Mac에서 본인 Soniox/Upstage 키를 직접 사용합니다. Relay를 거치지 않습니다.",
    hostedSection: "Bartleby hosted 접속",
    relayLabel: "Bartleby Relay 토큰",
    relayHelper:
      "지인 베타용 접속: api.heybartleby.com을 통해 STT와 노트 요청을 보내며 Notique의 Soniox/Upstage 키를 사용합니다. 제공자 호출을 제외한 오디오와 노트는 계속 로컬에 남습니다.",
    hostedNotice: "직접 비용을 관리하거나 별도 감사 경계가 필요한 사용자는 언제든 BYOK로 바꿀 수 있습니다.",
    directSection: "직접 제공자 키",
    sonioxLabel: "Soniox API 키",
    sonioxHelper: "Speech-to-text: Soniox stt-rt-v4 실시간 스트리밍. EN/KO 회의록에 필요합니다.",
    upstageLabel: "Upstage API 키",
    upstageHelper:
      "LLM: Upstage solar-pro3 직접 API. final note에 사용하며 OpenRouter/local model은 쓰지 않습니다.",
  },
  en: {
    aria: "Provider access mode",
    hostedTitle: "Hosted beta",
    hostedBadge: "recommended",
    hostedBody: "Use a Bartleby relay token. Notique pays Soniox + Upstage while friends test the app.",
    byokTitle: "BYOK",
    byokBadge: "advanced",
    byokBody: "Use your own Soniox and Upstage keys directly from this Mac. No relay in the path.",
    hostedSection: "Bartleby hosted access",
    relayLabel: "Bartleby Relay Token",
    relayHelper:
      "Friends beta access: sends STT and note requests through api.heybartleby.com with Notique's Soniox/Upstage keys. Audio and notes still stay local except provider calls.",
    hostedNotice: "BYOK remains available for users who want direct provider billing or their own audit boundary.",
    directSection: "Direct provider keys",
    sonioxLabel: "Soniox API Key",
    sonioxHelper: "Speech-to-text: Soniox stt-rt-v4 realtime streaming. Required for EN/KO transcription.",
    upstageLabel: "Upstage API Key",
    upstageHelper:
      "LLM: Upstage solar-pro3 direct API. Used for final notes; no OpenRouter/local model.",
  },
} as const;

export default function KeysTab({ onChanged, language }: Props) {
  const prefs = loadPrefs();
  const lang = language ?? prefs.onboarding_language;
  const copy = COPY[lang];
  const [mode, setMode] = useState<ProviderMode>(() => prefs.provider_mode);
  const [relay, setRelay] = useState<KeyStatus>(EMPTY_STATUS);
  const [soniox, setSoniox] = useState<KeyStatus>(EMPTY_STATUS);
  const [upstage, setUpstage] = useState<KeyStatus>(EMPTY_STATUS);

  const refresh = async () => {
    const [r, s, u] = await Promise.all([
      invoke<KeyStatus>("api_key_status", { name: "BARTLEBY_RELAY_TOKEN" }),
      invoke<KeyStatus>("api_key_status", { name: "SONIOX_API_KEY" }),
      invoke<KeyStatus>("api_key_status", { name: "UPSTAGE_API_KEY" }),
    ]);
    setRelay(r);
    setSoniox(s);
    setUpstage(u);
  };

  useEffect(() => {
    refresh();
  }, []);

  const notify = () => {
    refresh();
    onChanged();
  };

  const chooseMode = (next: ProviderMode) => {
    setMode(next);
    setPref("provider_mode", next);
    onChanged();
  };

  return (
    <>
      <div className={styles.modeGrid} role="radiogroup" aria-label={copy.aria}>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "hosted"}
          className={`${styles.modeCard} ${mode === "hosted" ? styles.modeActive : ""}`}
          onClick={() => chooseMode("hosted")}
        >
          <div className={styles.modeTop}>
            <span className={styles.modeTitle}>{copy.hostedTitle}</span>
            <span className={styles.badge}>{copy.hostedBadge}</span>
          </div>
          <p>{copy.hostedBody}</p>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "byok"}
          className={`${styles.modeCard} ${mode === "byok" ? styles.modeActive : ""}`}
          onClick={() => chooseMode("byok")}
        >
          <div className={styles.modeTop}>
            <span className={styles.modeTitle}>{copy.byokTitle}</span>
            <span className={styles.badge}>{copy.byokBadge}</span>
          </div>
          <p>{copy.byokBody}</p>
        </button>
      </div>

      {mode === "hosted" ? (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{copy.hostedSection}</span>
          <KeyInput
            name="BARTLEBY_RELAY_TOKEN"
            label={copy.relayLabel}
            helper={copy.relayHelper}
            storedSource={relay.source}
            language={lang}
            onSaved={notify}
            onCleared={notify}
          />
          <p className={styles.notice}>{copy.hostedNotice}</p>
        </div>
      ) : (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{copy.directSection}</span>
          <KeyInput
            name="SONIOX_API_KEY"
            label={copy.sonioxLabel}
            helper={copy.sonioxHelper}
            storedSource={soniox.source}
            language={lang}
            onSaved={notify}
            onCleared={notify}
          />
          <KeyInput
            name="UPSTAGE_API_KEY"
            label={copy.upstageLabel}
            helper={copy.upstageHelper}
            storedSource={upstage.source}
            language={lang}
            onSaved={notify}
            onCleared={notify}
          />
        </div>
      )}
    </>
  );
}
