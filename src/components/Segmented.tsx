import styles from "./Segmented.module.css";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: Props<T>) {
  return (
    <div className={`${styles.group} ${disabled ? styles.disabled : ""}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.option} ${value === opt.value ? styles.active : ""}`}
          onClick={() => !disabled && onChange(opt.value)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
