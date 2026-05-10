import styles from "./Gallery.module.css";
import { Manifesto } from "./sections/00-Manifesto";
import { ColorTokens } from "./sections/01-Color";
import { Typography } from "./sections/02-Typography";

/* ── Hero (chrome — lives in switchboard) ── */
function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles["hero-rule"]} />
      <div className={styles["hero-grid"]}>
        <div className="col gap-3">
          <div className="eyebrow">Design System · v0.1 · 2026</div>
          <div className="eyebrow">Mac · Tauri · Korean-first</div>
        </div>
        <div className={styles["hero-title-block"]}>
          <h1 className={`${styles["hero-title"]} display`}>bartleby</h1>
          <div className={`${styles["hero-epigraph"]} serif-quote`}>
            "I would prefer not to take notes."
          </div>
          <div className={styles["hero-sub"]}>
            A meeting scrivener for Mac. Cloud-powered. Locally owned.<br />
            <span className="ko">받아 적기 싫은 미팅까지 바틀비가 받아 적습니다.</span>
          </div>
        </div>
        <div className="col gap-2" style={{ alignItems: "flex-end", textAlign: "right" }}>
          <div className="eyebrow">heybartleby.com</div>
          <div className="eyebrow">@heybartleby</div>
        </div>
      </div>
      <div className={styles["hero-rule"]} />
    </header>
  );
}

/* ── Gallery (default export — switchboard) ── */
export default function Gallery() {
  return (
    <div className={styles["ds-page"]}>
      <Hero />
      <Manifesto />
      <ColorTokens />
      <Typography />
    </div>
  );
}
