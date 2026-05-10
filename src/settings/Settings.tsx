import { useState } from "react";
import KeysTab from "./KeysTab";
import ModesTab from "./ModesTab";
import StorageTab from "./StorageTab";
import ShortcutsTab from "./ShortcutsTab";
import AboutTab from "./AboutTab";
import styles from "./Settings.module.css";

type TabId = "keys" | "modes" | "storage" | "shortcuts" | "about";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "keys", label: "Keys" },
  { id: "modes", label: "Modes" },
  { id: "storage", label: "Storage" },
  { id: "shortcuts", label: "Shortcuts" },
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
          {activeTab === "modes" && <ModesTab />}
          {activeTab === "storage" && <StorageTab />}
          {activeTab === "shortcuts" && <ShortcutsTab />}
          {activeTab === "about" && <AboutTab />}
        </div>

        <div className={styles.footer}>
          {activeTab === "keys" && (
            <p className={styles.footnote}>
              Both keys are stored in macOS Keychain. Bartleby never sees them outside this device.
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
