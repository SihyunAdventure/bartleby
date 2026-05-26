import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import KeyInput from "../components/KeyInput";
import { loadPrefs, setPref, type ProviderMode } from "./prefs";
import styles from "./KeysTab.module.css";

interface KeyStatus {
  present: boolean;
  source: "keychain" | "env" | "file" | null;
}

interface Props {
  onChanged: () => void;
}

const EMPTY_STATUS: KeyStatus = { present: false, source: null };

export default function KeysTab({ onChanged }: Props) {
  const [mode, setMode] = useState<ProviderMode>(() => loadPrefs().provider_mode);
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
      <div className={styles.modeGrid} role="radiogroup" aria-label="Provider access mode">
        <button
          type="button"
          role="radio"
          aria-checked={mode === "hosted"}
          className={`${styles.modeCard} ${mode === "hosted" ? styles.modeActive : ""}`}
          onClick={() => chooseMode("hosted")}
        >
          <div className={styles.modeTop}>
            <span className={styles.modeTitle}>Hosted beta</span>
            <span className={styles.badge}>recommended</span>
          </div>
          <p>Use a Bartleby relay token. Notique pays Soniox + Upstage while friends test the app.</p>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "byok"}
          className={`${styles.modeCard} ${mode === "byok" ? styles.modeActive : ""}`}
          onClick={() => chooseMode("byok")}
        >
          <div className={styles.modeTop}>
            <span className={styles.modeTitle}>BYOK</span>
            <span className={styles.badge}>advanced</span>
          </div>
          <p>Use your own Soniox and Upstage keys directly from this Mac. No relay in the path.</p>
        </button>
      </div>

      {mode === "hosted" ? (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Bartleby hosted access</span>
          <KeyInput
            name="BARTLEBY_RELAY_TOKEN"
            label="Bartleby Relay Token"
            helper="Friends beta access: sends STT and note requests through api.heybartleby.com with Notique's Soniox/Upstage keys. Audio and notes still stay local except provider calls."
            storedSource={relay.source}
            onSaved={notify}
            onCleared={notify}
          />
          <p className={styles.notice}>
            BYOK remains available for users who want direct provider billing or their own audit boundary.
          </p>
        </div>
      ) : (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Direct provider keys</span>
          <KeyInput
            name="SONIOX_API_KEY"
            label="Soniox API Key"
            helper="Speech-to-text: Soniox stt-rt-v4 realtime streaming. Required for EN/KO transcription."
            storedSource={soniox.source}
            onSaved={notify}
            onCleared={notify}
          />
          <KeyInput
            name="UPSTAGE_API_KEY"
            label="Upstage API Key"
            helper="LLM: Upstage solar-pro3 direct API. Used for Korean translation and final notes; no OpenRouter/local model."
            storedSource={upstage.source}
            onSaved={notify}
            onCleared={notify}
          />
        </div>
      )}
    </>
  );
}
