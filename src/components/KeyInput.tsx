import { useState, type ChangeEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppLanguage } from "../settings/prefs";
import styles from "./KeyInput.module.css";

type Status = "idle" | "verifying" | "verified" | "invalid";

interface Props {
  /// Backend identifier — also the env-var name for ENV fallback parity.
  name: string;
  label: string;
  helper: string;
  /// Whether a key is already stored (controls placeholder + initial state).
  storedSource: "keychain" | "env" | "file" | null;
  language?: AppLanguage;
  onSaved: () => void;
  onCleared: () => void;
}

const COPY = {
  ko: {
    enterKey: "먼저 키를 입력해 주세요.",
    saved: "Keychain에 저장했습니다. 다음 녹음부터 적용됩니다.",
    cleared: "Keychain에서 삭제했습니다.",
    keychainPlaceholder: "•••••••••••••••••••• Keychain에 저장됨",
    envPlaceholder: "ENV에서 불러옴 (여기에 저장하면 덮어쓰기)",
    filePlaceholder: "로컬 개발용 secret 파일에서 불러옴",
    pastePlaceholder: "키 붙여넣기",
    verifying: "검증 중…",
    verified: "✓ 검증됨",
    invalid: "확인 필요",
    verify: "검증",
    verifyingAria: "검증 중",
    save: "저장",
    clear: "삭제",
  },
  en: {
    enterKey: "Enter a key first.",
    saved: "Saved to Keychain. Restart capture to apply.",
    cleared: "Cleared from Keychain.",
    keychainPlaceholder: "•••••••••••••••••••• stored in Keychain",
    envPlaceholder: "loaded from ENV (override by saving here)",
    filePlaceholder: "loaded from local dev secret file",
    pastePlaceholder: "paste key",
    verifying: "verifying…",
    verified: "✓ verified",
    invalid: "preferred not to.",
    verify: "Verify",
    verifyingAria: "verifying",
    save: "Save",
    clear: "Clear",
  },
} as const;

export default function KeyInput({
  name,
  label,
  helper,
  storedSource,
  language = "en",
  onSaved,
  onCleared,
}: Props) {
  const copy = COPY[language];
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (status !== "idle") {
      setStatus("idle");
      setMessage(null);
    }
  };

  const verify = async () => {
    if (!value.trim()) {
      setStatus("invalid");
      setMessage(copy.enterKey);
      return;
    }
    setStatus("verifying");
    setMessage(null);
    try {
      await invoke("verify_api_key", { name, value });
      setStatus("verified");
      setMessage(null);
    } catch (err) {
      setStatus("invalid");
      setMessage(String(err));
    }
  };

  const save = async () => {
    if (!value.trim()) {
      setStatus("invalid");
      setMessage(copy.enterKey);
      return;
    }
    try {
      await invoke("save_api_key", { name, value });
      setValue("");
      setStatus("idle");
      setMessage(copy.saved);
      onSaved();
    } catch (err) {
      setStatus("invalid");
      setMessage(String(err));
    }
  };

  const clear = async () => {
    try {
      await invoke("clear_api_key", { name });
      setValue("");
      setStatus("idle");
      setMessage(copy.cleared);
      onCleared();
    } catch (err) {
      setStatus("invalid");
      setMessage(String(err));
    }
  };

  const placeholder =
    storedSource === "keychain"
      ? copy.keychainPlaceholder
      : storedSource === "env"
        ? copy.envPlaceholder
        : storedSource === "file"
          ? copy.filePlaceholder
          : copy.pastePlaceholder;

  let statusBadge: React.ReactNode = null;
  if (status === "verifying") statusBadge = <span className={styles.statusVerifying}>{copy.verifying}</span>;
  else if (status === "verified") statusBadge = <span className={styles.statusVerified}>{copy.verified}</span>;
  else if (status === "invalid") statusBadge = <span className={styles.statusInvalid}>{copy.invalid}</span>;

  const inputClass = status === "invalid" ? `${styles.input} ${styles.hasError}` : styles.input;
  const messageClass = status === "invalid" ? `${styles.message} ${styles.messageError}` : styles.message;

  return (
    <div className={styles.row}>
      <div className={styles.label}>
        <span>{label}</span>
        {statusBadge}
      </div>
      <p className={styles.helper}>{helper}</p>
      <div className={styles.fieldRow}>
        <input
          className={inputClass}
          type="password"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          spellCheck={false}
          autoComplete="off"
        />
        <button className="btn" onClick={verify} disabled={status === "verifying" || !value.trim()}>
          {status === "verifying" ? <span className="rec-spinner" aria-label={copy.verifyingAria} /> : copy.verify}
        </button>
        <button
          className="btn btn-primary"
          onClick={save}
          disabled={status === "verifying" || !value.trim()}
        >
          {copy.save}
        </button>
        <button className="btn" onClick={clear} disabled={!storedSource}>
          {copy.clear}
        </button>
      </div>
      {message && <p className={messageClass}>{message}</p>}
    </div>
  );
}
