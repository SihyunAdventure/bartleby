import { useState } from "react";
import KeysTab from "./KeysTab";
import RecordingTab from "./RecordingTab";
import StorageTab from "./StorageTab";
import AboutTab from "./AboutTab";
import styles from "./Settings.module.css";

type TabId = "keys" | "recording" | "storage" | "about";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "keys", label: "Keys" },
  { id: "recording", label: "Recording" },
  { id: "storage", label: "Storage" },
  { id: "about", label: "About" },
];

interface Props {
  onClose: () => void;
  onChange: () => void;
}

export default function Settings({ onClose, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("keys");

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <p className={styles.epigraph}>Bartleby would prefer not to bother you.</p>
        </div>

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {activeTab === "keys" && <KeysTab onChanged={onChange} />}
          {activeTab === "recording" && <RecordingTab />}
          {activeTab === "storage" && <StorageTab />}
          {activeTab === "about" && <AboutTab />}
        </div>

        <div className={styles.footer}>
          {activeTab === "keys" && (
            <p className={styles.footnote}>
              Soniox hears speech. Upstage Solar Pro 3 writes Korean notes. Both keys are stored in macOS Keychain.
            </p>
          )}
          <div className={styles.closeRow}>
            <button className="btn" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
