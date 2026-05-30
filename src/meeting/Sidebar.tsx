import { loadPrefs } from "../settings/prefs";
import styles from "./Sidebar.module.css";

export type LibraryFilter = "all" | "today" | "week";

interface Props {
  onOpenSettings: () => void;
  captureRunning: boolean;
  keysOk: boolean;
  sessionCount: number;
  todayCount: number;
  weekCount: number;
  view: "library" | "recording" | "dictation";
  libraryFilter: LibraryFilter;
  onSelectFilter: (f: LibraryFilter) => void;
  dictationCount: number;
  onSelectDictations: () => void;
}

const LIBRARY_NAV: Array<{
  key: LibraryFilter;
  label: string;
  icon: string;
}> = [
  { key: "all", label: "All meetings", icon: "all" },
  { key: "today", label: "Today", icon: "today" },
  { key: "week", label: "This week", icon: "week" },
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
    default:
      return (
        <svg {...props}>
          <rect x="2.5" y="2.5" width="7" height="7" />
        </svg>
      );
  }
}

function DictationIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4.5" y="1.5" width="3" height="6" rx="1.5" />
      <path d="M3 6a3 3 0 0 0 6 0M6 9v1.5" />
    </svg>
  );
}

export default function Sidebar({
  onOpenSettings,
  captureRunning,
  keysOk,
  sessionCount,
  todayCount,
  weekCount,
  view,
  libraryFilter,
  onSelectFilter,
  dictationCount,
  onSelectDictations,
}: Props) {
  const providerMode = loadPrefs().provider_mode;
  const readyLabel = providerMode === "hosted" ? "Hosted token ready" : "Keys verified";
  const missingLabel = providerMode === "hosted" ? "Hosted token missing" : "Keys missing";
  const providerMeta = providerMode === "hosted" ? "HOSTED RELAY" : "SONIOX · UPSTAGE";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>bartleby</div>
        <div className={styles.brandEyebrow}>scrivener · v0.1</div>
      </div>

      <div className={styles.navScroll}>
        <div className="sidebar-header">LIBRARY</div>
        {LIBRARY_NAV.map((it) => {
          const count =
            it.key === "all"
              ? sessionCount
              : it.key === "today"
              ? todayCount
              : weekCount;
          const selected = view === "library" && libraryFilter === it.key;
          return (
            <div
              key={it.key}
              className="side-item"
              role="button"
              tabIndex={0}
              aria-selected={selected}
              onClick={() => onSelectFilter(it.key)}
            >
              <span className="ico">
                <SideIcon name={it.icon} />
              </span>
              <span style={{ flex: 1 }}>{it.label}</span>
              <span className="count tabular">{count}</span>
            </div>
          );
        })}

        <div className="sidebar-header" style={{ marginTop: 16 }}>
          받아쓰기
        </div>
        <div
          className="side-item"
          role="button"
          tabIndex={0}
          aria-selected={view === "dictation"}
          onClick={onSelectDictations}
        >
          <span className="ico">
            <DictationIcon />
          </span>
          <span style={{ flex: 1 }}>받아쓰기 기록</span>
          <span className="count tabular">{dictationCount}</span>
        </div>
      </div>

      <button className={styles.settingsBtn} onClick={onOpenSettings}>
        ⚙ Settings
      </button>

      <div className={styles.footer}>
        <div className="row gap-2">
          <span className={`dot ${keysOk ? "dot-ok" : "dot-warn"}`} />
          <span className={styles.footerText}>
            {keysOk ? readyLabel : missingLabel}
          </span>
        </div>
        <div className={styles.footerMeta}>{providerMeta}</div>
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
