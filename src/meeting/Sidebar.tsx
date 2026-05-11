import Segmented from "../components/Segmented";
import { setPref, type AppMode } from "../settings/prefs";
import styles from "./Sidebar.module.css";

interface Props {
  appMode: AppMode;
  onAppModeChange: (m: AppMode) => void;
  onOpenSettings: () => void;
  captureRunning: boolean;
  recordingStart: Date | null;
  keysOk: boolean;
  sessionCount: number;
  view: "library" | "recording";
}

const LIBRARY_NAV = [
  { key: "all", label: "All meetings", icon: "all" },
  { key: "today", label: "Today", icon: "today" },
  { key: "week", label: "This week", icon: "week" },
  { key: "starred", label: "Starred", icon: "starred" },
];

const PROJECTS_NAV = [
  { key: "fundraise", label: "Fundraise — seed" },
  { key: "design", label: "Design partners" },
  { key: "hiring", label: "Hiring" },
  { key: "ops", label: "Operations" },
];

function SideIcon({ name }: { name: string }) {
  const stroke = "currentColor";
  const props = {
    width: 12,
    height: 12,
    viewBox: "0 0 12 12",
    fill: "none" as const,
    stroke,
    strokeWidth: 1.2,
    strokeLinecap: "round" as const,
  };
  switch (name) {
    case "all":
      return (
        <svg {...props}>
          <path d="M2 3h8M2 6h8M2 9h8" />
        </svg>
      );
    case "today":
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="3.5" />
          <path d="M6 6V4" />
        </svg>
      );
    case "week":
      return (
        <svg {...props}>
          <rect x="2" y="3" width="8" height="7" />
          <path d="M2 5h8" />
        </svg>
      );
    case "starred":
      return (
        <svg {...props}>
          <path d="M6 2l1.2 2.6L10 5l-2 1.8.5 2.7L6 8.2 3.5 9.5 4 6.8 2 5l2.8-.4z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <rect x="2.5" y="2.5" width="7" height="7" />
        </svg>
      );
  }
}

export default function Sidebar({
  appMode,
  onAppModeChange,
  onOpenSettings,
  captureRunning,
  keysOk,
  sessionCount,
  view,
}: Props) {
  const handleModeChange = (m: AppMode) => {
    onAppModeChange(m);
    setPref("app_mode", m);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>bartleby</div>
        <div className={styles.brandEyebrow}>scrivener · v0.1</div>
      </div>

      <div className={styles.modeRow}>
        <Segmented
          options={[
            { value: "watch", label: "Watch" },
            { value: "meeting", label: "Meeting" },
          ]}
          value={appMode}
          onChange={handleModeChange}
        />
      </div>

      <div className={styles.navScroll}>
        <div className="sidebar-header">LIBRARY</div>
        {LIBRARY_NAV.map((it) => (
          <div
            key={it.key}
            className="side-item"
            aria-selected={it.key === "all" && view === "library"}
          >
            <span className="ico">
              <SideIcon name={it.icon} />
            </span>
            <span style={{ flex: 1 }}>{it.label}</span>
            <span className="count tabular">
              {it.key === "all" ? sessionCount : 0}
            </span>
          </div>
        ))}

        <div className="sidebar-header" style={{ marginTop: 14 }}>
          PROJECTS
        </div>
        {PROJECTS_NAV.map((it) => (
          <div key={it.key} className="side-item" aria-disabled="true">
            <span className="ico">
              <SideIcon name="default" />
            </span>
            <span style={{ flex: 1 }}>{it.label}</span>
            <span className="count tabular">0</span>
          </div>
        ))}
      </div>

      <button className={styles.settingsBtn} onClick={onOpenSettings}>
        ⚙ Settings
      </button>

      <div className={styles.footer}>
        <div className="row gap-2">
          <span className={`dot ${keysOk ? "dot-ok" : "dot-warn"}`} />
          <span className={styles.footerText}>
            {keysOk ? "Keys verified" : "Keys missing"}
          </span>
        </div>
        <div className={styles.footerMeta}>SONIOX · UPSTAGE</div>
        {captureRunning && (
          <div className={styles.footerRec}>
            <span className="dot dot-rec" />
            <span className={styles.footerRecText}>recording</span>
          </div>
        )}
      </div>
    </aside>
  );
}
