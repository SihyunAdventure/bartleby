import { useEffect, useState } from "react";
import { loadPrefs, setPref, type UpdateChannel } from "./prefs";
import Segmented from "../components/Segmented";
import styles from "./AboutTab.module.css";

const VERSION = "0.1.0";

export default function AboutTab() {
  const [updateChannel, setUpdateChannel] = useState<UpdateChannel>("stable");

  useEffect(() => {
    const p = loadPrefs();
    setUpdateChannel(p.update_channel);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <span className={styles.name}>Bartleby</span>
        <span className={styles.version}>v{VERSION}</span>
        <p className={styles.tagline}>"I would prefer not to listen in English."</p>
      </div>

      <div className={styles.links}>
        <a
          href="https://heybartleby.com"
          target="_blank"
          rel="noreferrer"
          className={styles.link}
        >
          heybartleby.com
        </a>
        <span className={styles.sep}>·</span>
        <a
          href="https://github.com/heybartleby/bartleby"
          target="_blank"
          rel="noreferrer"
          className={styles.link}
        >
          github.com/heybartleby/bartleby
        </a>
      </div>

      <div className={styles.divider} />

      <div className={styles.updateRow}>
        <div className={styles.updateLeft}>
          <span className={styles.fieldLabel}>Auto-update</span>
          <span className={styles.lastChecked}>Last checked: —</span>
        </div>
        <button
          className="btn"
          disabled
          title="추후 슬라이스 (auto-update infra)"
        >
          Check now…
        </button>
      </div>

      <div className={styles.row}>
        <span className={styles.fieldLabel}>Update channel</span>
        <Segmented<UpdateChannel>
          options={[
            { value: "stable", label: "Stable" },
            { value: "beta", label: "Beta" },
          ]}
          value={updateChannel}
          onChange={(v) => {
            setUpdateChannel(v);
            setPref("update_channel", v);
          }}
        />
      </div>

      <div className={styles.divider} />

      <p className={styles.license}>License: MIT (or source-available — TBD Phase 5)</p>

      <p className={styles.footer}>Design with care from Seoul.</p>
    </div>
  );
}
