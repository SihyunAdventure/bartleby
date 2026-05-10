import styles from "./Toggle.module.css";

interface Props {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function Toggle({ checked, disabled = false, onChange, label }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`${styles.track} ${checked ? styles.on : ""} ${disabled ? styles.disabled : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      type="button"
      aria-label={label}
    >
      <span className={styles.thumb} />
    </button>
  );
}
