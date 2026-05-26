import { useEffect, useState } from "react";
import { loadPrefs, setPref } from "./prefs";
import Toggle from "../components/Toggle";
import styles from "./RecordingTab.module.css";

export default function RecordingTab() {
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [autoSummarize, setAutoSummarize] = useState(true);

  useEffect(() => {
    const p = loadPrefs();
    setTranslateEnabled(p.translate_enabled);
    setAutoSummarize(p.auto_summarize);
  }, []);

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Recording</h3>

        <div className={styles.row}>
          <div>
            <span className={styles.rowLabel}>Korean translation while recording</span>
            <p className={styles.helper}>
              Sends finalized system-audio transcript lines to Upstage Solar Pro 3 via the selected Hosted/BYOK access mode.
              Keep it off for Korean-only meetings to reduce cost.
            </p>
          </div>
          <Toggle
            checked={translateEnabled}
            onChange={(v) => {
              setTranslateEnabled(v);
              setPref("translate_enabled", v);
            }}
          />
        </div>

        <div className={styles.row}>
          <div>
            <span className={styles.rowLabel}>Finalize note on stop</span>
            <p className={styles.helper}>
              When enabled, Bartleby calls Upstage Solar Pro 3 after Stop through Hosted/BYOK access to create
              TL;DR, outline, one-pager, and quote. When disabled, use Generate note manually.
            </p>
          </div>
          <Toggle
            checked={autoSummarize}
            onChange={(v) => {
              setAutoSummarize(v);
              setPref("auto_summarize", v);
            }}
          />
        </div>
      </section>
    </div>
  );
}
