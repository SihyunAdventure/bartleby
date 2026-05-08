import type { ReactNode } from "react";
import styles from "../Gallery.module.css";

interface DSSectionProps {
  id: string;
  kicker: string;
  title: string;
  lede?: string;
  children: ReactNode;
}

export function DSSection({ id, kicker, title, lede, children }: DSSectionProps) {
  return (
    <section id={id} className={styles["ds-section"]}>
      <header className={styles["ds-section-h"]}>
        <div className="eyebrow">{kicker}</div>
        <div>
          <h2 className={styles["ds-section-title"]}>{title}</h2>
          {lede && <p className={styles["ds-section-lede"]}>{lede}</p>}
        </div>
      </header>
      <div className={styles["ds-section-body"]}>{children}</div>
    </section>
  );
}
