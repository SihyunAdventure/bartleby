import styles from "../Gallery.module.css";
import { DSSection } from "../components/DSSection";
import { Swatch } from "../components/Swatch";

const paper = ["paper", "paper-2", "paper-3", "paper-edge", "rule", "rule-strong"];
const ink = ["ink", "ink-2", "ink-3", "ink-4", "ink-5", "ink-6"];
const status = ["rec", "ok", "warn", "danger"];

export function ColorTokens() {
  return (
    <DSSection
      id="colors"
      kicker="01 · Color"
      title="Paper & ink."
      lede="Pure neutrals (chroma 0). Warm-paper light, ink-black dark. Status colors are the only saturation in the system, used sparingly."
    >
      <div className={styles["ds-color-blocks"]}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Surfaces — paper</div>
          <div className={styles["swatch-grid"]}>
            {paper.map((n) => (
              <Swatch key={n} name={n} varName={`--${n}`} />
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Foreground — ink</div>
          <div className={styles["swatch-grid"]}>
            {ink.map((n) => (
              <Swatch key={n} name={n} varName={`--${n}`} />
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Status</div>
          <div className={styles["swatch-grid"]}>
            {status.map((n) => (
              <Swatch key={n} name={n} varName={`--${n}`} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles["theme-pair"]}>
        {/* light theme card — data-theme="light" falls through to :root values */}
        <div data-theme="light" className={styles["theme-card"]}>
          <div className={styles["theme-strip"]} style={{ background: "var(--paper)" }}>
            <span className={styles.dot} style={{ background: "var(--ink)" }} />
            <span className="mono">light · paper</span>
          </div>
          <div
            className={styles["theme-card-body"]}
            style={{ background: "var(--paper)", color: "var(--ink)" }}
          >
            <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>Bartleby</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
              The default surface. Aged ivory.
            </div>
          </div>
        </div>

        {/* dark theme card — data-theme="dark" overrides vars via tokens.css cascade */}
        <div data-theme="dark" className={styles["theme-card"]}>
          <div className={styles["theme-strip"]} style={{ background: "var(--paper)", color: "var(--ink)" }}>
            <span className={styles.dot} style={{ background: "var(--ink)" }} />
            <span className="mono">dark · ink</span>
          </div>
          <div
            className={styles["theme-card-body"]}
            style={{ background: "var(--paper)", color: "var(--ink)" }}
          >
            <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>Bartleby</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
              For night sessions. Slightly cool ink.
            </div>
          </div>
        </div>
      </div>
    </DSSection>
  );
}
