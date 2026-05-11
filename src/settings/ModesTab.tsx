import { useEffect, useState } from "react";
import {
  loadPrefs,
  setPref,
  type CaptionMode,
  type OverlayPosition,
  type BilingualLayout,
  type SummaryLanguage,
} from "./prefs";
import Segmented from "../components/Segmented";
import Slider from "../components/Slider";
import Toggle from "../components/Toggle";
import styles from "./ModesTab.module.css";

export default function ModesTab() {
  const [captionMode, setCaptionMode] = useState<CaptionMode>("ko");
  const [overlayOpacity, setOverlayOpacity] = useState(85);
  const [captionFontSize, setCaptionFontSize] = useState(16);
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>("bottom-left");
  const [pauseThreshold, setPauseThreshold] = useState(3);
  const [clickThrough, setClickThrough] = useState(false);
  const [bilingualLayout, setBilingualLayout] = useState<BilingualLayout>("side_by_side");
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [summaryLanguage, setSummaryLanguage] = useState<SummaryLanguage>("ko");
  const [translateEnabled, setTranslateEnabled] = useState(true);

  useEffect(() => {
    const p = loadPrefs();
    setCaptionMode(p.caption_mode);
    setOverlayOpacity(p.overlay_opacity);
    setCaptionFontSize(p.caption_font_size);
    setOverlayPosition(p.overlay_position);
    setPauseThreshold(p.caption_pause_threshold_s);
    setClickThrough(p.click_through_default);
    setBilingualLayout(p.bilingual_layout);
    setAutoSummarize(p.auto_summarize);
    setSummaryLanguage(p.summary_language);
    setTranslateEnabled(p.translate_enabled);
  }, []);

  return (
    <div className={styles.root}>
      {/* ── Watch Mode ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Watch Mode</h3>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Caption display</span>
          <Segmented<CaptionMode>
            options={[
              { value: "ko", label: "KO only" },
              { value: "ko_en", label: "KO + EN" },
              { value: "en", label: "EN only" },
            ]}
            value={captionMode}
            onChange={(v) => {
              setCaptionMode(v);
              setPref("caption_mode", v);
            }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Overlay opacity</span>
          <Slider
            min={60}
            max={100}
            step={1}
            value={overlayOpacity}
            unit="%"
            onChange={(v) => {
              setOverlayOpacity(v);
              setPref("overlay_opacity", v);
            }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Caption font size</span>
          <Segmented<string>
            options={[
              { value: "14", label: "14" },
              { value: "15", label: "15" },
              { value: "16", label: "16" },
              { value: "17", label: "17" },
              { value: "18", label: "18" },
            ]}
            value={String(captionFontSize)}
            onChange={(v) => {
              const n = Number(v);
              setCaptionFontSize(n);
              setPref("caption_font_size", n);
            }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Overlay position</span>
          <Segmented<OverlayPosition>
            options={[
              { value: "bottom-left", label: "↙ BL" },
              { value: "bottom-right", label: "↘ BR" },
              { value: "top-left", label: "↖ TL" },
              { value: "top-right", label: "↗ TR" },
            ]}
            value={overlayPosition}
            onChange={(v) => {
              setOverlayPosition(v);
              setPref("overlay_position", v);
            }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Pause threshold (s)</span>
          <input
            type="number"
            className={styles.numberInput}
            min={1}
            max={10}
            step={1}
            value={pauseThreshold}
            onChange={(e) => {
              const v = Number(e.currentTarget.value);
              setPauseThreshold(v);
              setPref("caption_pause_threshold_s", v);
            }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Click-through by default</span>
          <Toggle
            checked={clickThrough}
            onChange={(v) => {
              setClickThrough(v);
              setPref("click_through_default", v);
            }}
          />
        </div>
      </section>

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
