import { useEffect, useState } from "react";
import {
  loadPrefs,
  setPref,
  type BilingualLayout,
  type SummaryLanguage,
} from "./prefs";
import Segmented from "../components/Segmented";
import Toggle from "../components/Toggle";
import styles from "./ModesTab.module.css";

export default function ModesTab() {
  const [bilingualLayout, setBilingualLayout] = useState<BilingualLayout>("side_by_side");
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [summaryLanguage, setSummaryLanguage] = useState<SummaryLanguage>("ko");
  const [translateEnabled, setTranslateEnabled] = useState(true);

  useEffect(() => {
    const p = loadPrefs();
    setBilingualLayout(p.bilingual_layout);
    setAutoSummarize(p.auto_summarize);
    setSummaryLanguage(p.summary_language);
    setTranslateEnabled(p.translate_enabled);
  }, []);

  return (
    <div className={styles.root}>
      {/* ── Meeting Mode ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Meeting Mode</h3>

        <div className={styles.row}>
          <span className={styles.rowLabel}>한국어 번역</span>
          <Toggle
            checked={translateEnabled}
            onChange={(v) => {
              setTranslateEnabled(v);
              setPref("translate_enabled", v);
            }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Microphone source</span>
          <span className={styles.disabledSelect}>
            Default
            <span className={styles.disabledHint} title="Mic enumeration — coming in a later slice.">
              {" "}(not configurable yet)
            </span>
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Bilingual layout</span>
          <Segmented<BilingualLayout>
            options={[
              { value: "side_by_side", label: "KO|EN" },
              { value: "ko_above_en", label: "KO/EN" },
              { value: "single_auto", label: "Auto" },
            ]}
            value={bilingualLayout}
            onChange={(v) => {
              setBilingualLayout(v);
              setPref("bilingual_layout", v);
            }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Auto-summarize on stop</span>
          <Toggle
            checked={autoSummarize}
            onChange={(v) => {
              setAutoSummarize(v);
              setPref("auto_summarize", v);
            }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Summary language</span>
          <Segmented<SummaryLanguage>
            options={[
              { value: "ko", label: "한국어" },
              { value: "en", label: "English" },
            ]}
            value={summaryLanguage}
            onChange={(v) => {
              setSummaryLanguage(v);
              setPref("summary_language", v);
            }}
          />
        </div>
      </section>
    </div>
  );
}
