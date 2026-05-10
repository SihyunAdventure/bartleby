import styles from "./Slider.module.css";

interface Props {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
}

export default function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  unit,
  disabled = false,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`${styles.wrapper} ${disabled ? styles.disabled : ""}`}>
      <input
        type="range"
        className={styles.range}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
      <span className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
    </div>
  );
}
