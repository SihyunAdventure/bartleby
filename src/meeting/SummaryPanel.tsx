import styles from "./SummaryPanel.module.css";

interface Props {
  captureRunning: boolean;
}

export default function SummaryPanel({ captureRunning }: Props) {
  return (
    <aside className={styles.panel}>
      <div className={styles.eyebrow}>
        {captureRunning ? "Bartleby is preparing" : "Bartleby is waiting"}
      </div>

      <div className="summary" style={{ marginBottom: 16 }}>
        <h4>Working title</h4>
        <div className={styles.titleText}>
          {captureRunning ? "— still listening —" : "No session yet"}
        </div>
      </div>

      <div className="summary" style={{ marginBottom: 16 }}>
        <h4>Themes (so far)</h4>
        <ul>
          <li
            style={{
              color: "var(--ink-4)",
              fontStyle: "italic",
              fontFamily: "var(--font-serif)",
            }}
          >
            {captureRunning
              ? "Bartleby would prefer not to summarise yet. Themes appear after ~30 seconds."
              : "No themes yet. Press Record to begin."}
          </li>
        </ul>
      </div>

      <div
        className="summary"
        style={{ marginBottom: 16, borderLeftColor: "var(--rec)" }}
      >
        <h4 style={{ color: "var(--rec)" }}>Quote · candidate</h4>
        <div className={styles.quoteMock}>
          {captureRunning
            ? "— listening for a worthy line —"
            : "— no candidates yet —"}
        </div>
      </div>

      <div className={styles.footer}>
        <span className={`dot ${captureRunning ? "dot-ok" : ""}`} />
        <span className={styles.footerText}>
          Solar Pro 3 · re-summarising every 30s
        </span>
      </div>
    </aside>
  );
}
