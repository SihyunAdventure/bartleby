import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import styles from "./SummaryPanel.module.css";

interface SummaryUpdatePayload {
  working_title: string;
  themes: string[];
  quote_candidate: string | null;
}

interface Props {
  captureRunning: boolean;
  clearToken: number;
}

export default function SummaryPanel({ captureRunning, clearToken }: Props) {
  const [summary, setSummary] = useState<SummaryUpdatePayload | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Clear summary on each new recording session (clearToken increments)
  useEffect(() => {
    if (clearToken > 0) {
      setSummary(null);
      setUpdatedAt(null);
    }
  }, [clearToken]);

  useEffect(() => {
    const sub = listen<SummaryUpdatePayload>("summary_update", (event) => {
      setSummary(event.payload);
      setUpdatedAt(new Date());
    });
    return () => {
      sub.then((fn) => fn());
    };
  }, []);

  const updatedLabel = updatedAt
    ? updatedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : null;

  const eyebrow = !captureRunning
    ? "Bartleby is waiting"
    : summary
    ? `Bartleby last updated · ${updatedLabel}`
    : "Bartleby is preparing";

  const workingTitle = summary?.working_title?.trim();
  const themes = summary?.themes ?? [];
  const quote = summary?.quote_candidate?.trim() || null;

  return (
    <aside className={styles.panel}>
      <div className={styles.eyebrow}>{eyebrow}</div>

      <div className="summary" style={{ marginBottom: 16 }}>
        <h4>Working title</h4>
        <div className={styles.titleText}>
          {workingTitle && workingTitle.length > 0 ? (
            workingTitle
          ) : (
            <span className={styles.placeholder}>
              {captureRunning ? "— still listening —" : "No session yet"}
            </span>
          )}
        </div>
      </div>

      <div className="summary" style={{ marginBottom: 16 }}>
        <h4>Themes (so far)</h4>
        {themes.length > 0 ? (
          <ul>
            {themes.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        ) : (
          <ul>
            <li className={styles.placeholderItalic}>
              {captureRunning
                ? "Bartleby would prefer not to summarise yet. Themes appear after ~30 seconds."
                : "No themes yet. Press Record to begin."}
            </li>
          </ul>
        )}
      </div>

      <div
        className="summary"
        style={{ marginBottom: 16, borderLeftColor: "var(--rec)" }}
      >
        <h4 style={{ color: "var(--rec)" }}>Quote · candidate</h4>
        <div className={styles.quoteMock}>
          {quote ? (
            <>&ldquo;{quote}&rdquo;</>
          ) : (
            <span className={styles.placeholder}>
              {captureRunning
                ? "— listening for a worthy line —"
                : "— no candidates yet —"}
            </span>
          )}
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
