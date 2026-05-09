import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import KeyInput from "./components/KeyInput";
import styles from "./Settings.module.css";

interface KeyStatus {
  present: boolean;
  source: "keychain" | "env" | null;
}

interface Props {
  onClose: () => void;
  /// Bumped after save/clear so callers (App) re-fetch presence and decide
  /// whether to keep showing the first-launch banner.
  onChange: () => void;
}

export default function Settings({ onClose, onChange }: Props) {
  const [soniox, setSoniox] = useState<KeyStatus>({ present: false, source: null });
  const [upstage, setUpstage] = useState<KeyStatus>({ present: false, source: null });

  const refresh = async () => {
    const [s, u] = await Promise.all([
      invoke<KeyStatus>("api_key_status", { name: "SONIOX_API_KEY" }),
      invoke<KeyStatus>("api_key_status", { name: "UPSTAGE_API_KEY" }),
    ]);
    setSoniox(s);
    setUpstage(u);
  };

  useEffect(() => {
    refresh();
  }, []);

  const notify = () => {
    refresh();
    onChange();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <p className={styles.epigraph}>Bartleby would prefer not to bother you.</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.tabActive}`}>Keys</button>
          <button className={styles.tab} disabled title="Modes — coming in a later slice.">Modes</button>
          <button className={styles.tab} disabled title="Storage — coming in a later slice.">Storage</button>
          <button className={styles.tab} disabled title="Shortcuts — coming in a later slice.">Shortcuts</button>
          <button className={styles.tab} disabled title="About — coming in a later slice.">About</button>
        </div>

        <div className={styles.body}>
          <KeyInput
            name="SONIOX_API_KEY"
            label="Soniox API Key"
            helper="Used for STT (English/Korean transcription). ≈$0.12/hr at current pricing — confirm at sign-up."
            storedSource={soniox.source}
            onSaved={notify}
            onCleared={notify}
          />
          <KeyInput
            name="UPSTAGE_API_KEY"
            label="Upstage API Key"
            helper="Used for Korean translation (Solar Pro 3). $0.15/M in, $0.60/M out — caching kicks in after first call."
            storedSource={upstage.source}
            onSaved={notify}
            onCleared={notify}
          />
        </div>

        <div className={styles.footer}>
          <p className={styles.footnote}>
            Both keys are stored in macOS Keychain. Bartleby never sees them outside this device.
          </p>
          <div className={styles.closeRow}>
            <button className="btn" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
