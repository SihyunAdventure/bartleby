import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { loadPrefs, setPref } from "./prefs";
import Toggle from "../components/Toggle";
import styles from "./RecordingTab.module.css";

export default function RecordingTab() {
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [axTrusted, setAxTrusted] = useState<boolean | null>(null);

  const refreshAx = () =>
    invoke<boolean>("accessibility_status", { prompt: false })
      .then(setAxTrusted)
      .catch(() => setAxTrusted(null));

  useEffect(() => {
    const p = loadPrefs();
    setAutoSummarize(p.auto_summarize);
    void refreshAx();
  }, []);

  const enableAx = async () => {
    // Triggers the system prompt, then opens System Settings so the user can
    // flip the toggle for Bartleby.
    await invoke("accessibility_status", { prompt: true }).catch(() => {});
    await invoke("open_accessibility_settings").catch(() => {});
    void refreshAx();
  };

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Recording</h3>

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

      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Dictation</h3>

        <div className={styles.row}>
          <div>
            <span className={styles.rowLabel}>받아쓰기 (Fn 🌐 누른 채 말하기)</span>
            <p className={styles.helper}>
              Fn(🌐) 키를 누른 채 말하고 떼면, 받아 적은 텍스트가 지금 커서가 있는 앱에 입력됩니다.
              어느 앱에든 입력하려면 <strong>손쉬운 사용(Accessibility) 권한</strong>이 필요합니다.
            </p>
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <span className={styles.rowLabel}>
              손쉬운 사용 권한 ·{" "}
              {axTrusted === null ? "확인 중…" : axTrusted ? "허용됨 ✓" : "필요함"}
            </span>
            <p className={styles.helper}>
              권한이 없으면 받아쓰기 텍스트가 입력되지 않습니다.
            </p>
          </div>
          {!axTrusted && (
            <button className="btn" onClick={enableAx}>
              시스템 설정 열기
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
