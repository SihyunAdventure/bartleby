import styles from "../Gallery.module.css";

interface SwatchProps {
  name: string;
  varName: string;
}

export function Swatch({ name, varName }: SwatchProps) {
  return (
    <div className={styles.swatch}>
      <div className={styles["swatch-tile"]} style={{ background: `var(${varName})` }} />
      <div className={styles["swatch-meta"]}>
        <b>{name}</b>
        <span>{varName.replace("--", "")}</span>
      </div>
    </div>
  );
}
