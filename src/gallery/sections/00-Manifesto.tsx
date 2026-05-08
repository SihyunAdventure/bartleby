import styles from "../Gallery.module.css";
import { DSSection } from "../components/DSSection";

export function Manifesto() {
  return (
    <DSSection id="manifesto" kicker="00 · Manifesto" title="A scrivener, not an assistant.">
      <div className={styles["manifesto-grid"]}>
        <div>
          <p className={styles["manifesto-p"]}>
            Bartleby is named for Melville's copy-clerk — the one who, when asked to do
            anything beyond his copying, would politely reply: <em>"I would prefer not to."</em>
          </p>
          <p className={styles["manifesto-p"]}>
            Our Bartleby has the opposite affliction. He <em>insists</em> on copying — every
            meeting, every aside, every half-finished sentence — so that you may prefer not to.
          </p>
        </div>
        <div className={styles["manifesto-rules"]}>
          <div className={styles["rule-item"]}>
            <div className="eyebrow">Restraint</div>
            <p>Two fonts. One ink. No gradients. No mascots.</p>
          </div>
          <div className={styles["rule-item"]}>
            <div className="eyebrow">Paper</div>
            <p>The surface is paper, not glass. Aged ivory. Hairline rules.</p>
          </div>
          <div className={styles["rule-item"]}>
            <div className="eyebrow">Voice</div>
            <p>Polite, slightly archaic, faintly ironic. Never cute.</p>
          </div>
          <div className={styles["rule-item"]}>
            <div className="eyebrow">Korean-first</div>
            <p className="kr-leading">한글이 1등 시민. Pretendard for body, mono for chrome.</p>
          </div>
        </div>
      </div>
    </DSSection>
  );
}
