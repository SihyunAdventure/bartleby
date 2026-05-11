import { useState, type ChangeEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import styles from "./KeyInput.module.css";

type Status = "idle" | "verifying" | "verified" | "invalid";

interface Props {
  /// Backend identifier — also the env-var name for ENV fallback parity.
  name: string;
  label: string;
  helper: string;
  /// Whether a key is already stored (controls placeholder + initial state).
  storedSource: "keychain" | "env" | null;
  onSaved: () => void;
  onCleared: () => void;
}

export default function KeyInput({
  name,
  label,
  helper,
  storedSource,
  onSaved,
  onCleared,
}: Props) {
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
      setMessage("Enter a key first.");
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
      setMessage("Enter a key first.");
      return;
    }
    try {
      await invoke("save_api_key", { name, value });
      setValue("");
      setStatus("idle");
      setMessage("Saved to Keychain. Restart capture to apply.");
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
      setMessage("Cleared from Keychain.");
      onCleared();
    } catch (err) {
      setStatus("invalid");
      setMessage(String(err));
    }
  };

  const placeholder =
    storedSource === "keychain"
      ? "•••••••••••••••••••• stored in Keychain"
      : storedSource === "env"
        ? "loaded from ENV (override by saving here)"
        : "paste key";

  let statusBadge: React.ReactNode = null;
  if (status === "verifying") statusBadge = <span className={styles.statusVerifying}>verifying…</span>;
  else if (status === "verified") statusBadge = <span className={styles.statusVerified}>✓ verified</span>;
  else if (status === "invalid") statusBadge = <span className={styles.statusInvalid}>preferred not to.</span>;

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
          {status === "verifying" ? <span className="rec-spinner" aria-label="verifying" /> : "Verify"}
        </button>
        <button
          className="btn btn-primary"
          onClick={save}
          disabled={status === "verifying" || !value.trim()}
        >
          Save
        </button>
        <button className="btn" onClick={clear} disabled={!storedSource}>
          Clear
        </button>
      </div>
      {message && <p className={messageClass}>{message}</p>}
    </div>
  );
}
