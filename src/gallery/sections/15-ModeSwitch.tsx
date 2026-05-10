import styles from "../Gallery.module.css";
import { DSSection } from "../components/DSSection";

/* ── a. toggle preview data ── */

/* ── b/c. layout mock primitives ── */

interface LayoutBlockProps {
  label: string;
  note: string;
  children: React.ReactNode;
}

function LayoutBlock({ label, note, children }: LayoutBlockProps) {
  return (
    <div className={styles["mode-layout-mock"]}>
      <div className={styles["mode-layout-inner"]}>{children}</div>
      <div className={styles["mode-layout-label"]}>
        <span className="eyebrow">{label}</span>
        <span className={styles["mode-layout-note"]}>{note}</span>
      </div>
    </div>
  );
}

/* Watch mode layout rectangles */
function WatchLayoutMock() {
  return (
    <div className={styles["mode-layout-watch"]}>
      {/* hero: logo + epigraph centered top */}
      <div className={styles["mock-watch-hero"]}>
        <span className={styles["mock-label"]}>bartleby</span>
        <span className={styles["mock-sublabel"]}>"I would prefer not to."</span>
      </div>
      {/* capture panel center */}
      <div className={styles["mock-watch-capture"]}>
        <span className={styles["mock-label"]}>Capture buttons</span>
      </div>
      {/* overlay: floating bottom-left */}
      <div className={styles["mock-watch-overlay"]}>
        <span className={styles["mock-label-sm"]}>caption overlay</span>
      </div>
    </div>
  );
}

/* Meeting mode layout rectangles */
function MeetingLayoutMock() {
  return (
    <div className={styles["mode-layout-meeting"]}>
      {/* sidebar left 240px mock */}
      <div className={styles["mock-meeting-sidebar"]}>
        <span className={styles["mock-label"]}>Sidebar</span>
        <span className={styles["mock-sublabel"]}>rec status</span>
        <span className={styles["mock-sublabel"]}>mode switch</span>
        <span className={styles["mock-sublabel"]}>⚙</span>
      </div>
      {/* main right: transcript + controls */}
      <div className={styles["mock-meeting-main"]}>
        <span className={styles["mock-label"]}>Transcript</span>
        <span className={styles["mock-sublabel"]}>recording controls</span>
      </div>
    </div>
  );
}

/* ── d. cascade rules table data ── */
interface CascadeRow {
  target: string;
  effect: string;
  wire: string;
  wired: boolean;
}

const CASCADE_ROWS: CascadeRow[] = [
  {
    target: "data-mode attr → .container",
    effect: "layout cascade root",
    wire: "wire ✅ this slice",
    wired: true,
  },
  {
    target: "capture target",
    effect: "Watch=system only · Meeting=mic+system",
    wire: "chunk B (US-005)",
    wired: false,
  },
  {
    target: "overlay visibility",
    effect: "Option A: storage-only this slice",
    wire: "wire ✅ this slice",
    wired: true,
  },
  {
    target: "default shortcuts",
    effect: "N/A this chunk",
    wire: "—",
    wired: false,
  },
];

/* ── Section ── */
export function ModeSwitch() {
  return (
    <DSSection
      id="modeswitch"
      kicker="15 · Mode Switch"
      title="Mode Switch"
      lede="Watch ↔ Meeting — 한 토글로 두 모드."
    >

      {/* ── a. mode toggle preview ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Mode toggle
      </div>
      <div className={styles["mode-switch-toggle-preview"]}>
        {/* Watch tab — active */}
        <div className={`${styles["mode-toggle-tab"]} ${styles["mode-toggle-tab--active"]}`}>
          Watch
        </div>
        {/* Meeting tab — inactive */}
        <div className={styles["mode-toggle-tab"]}>
          Meeting
        </div>
      </div>
      <p
        style={{
          margin: "var(--s-3) 0 0",
          fontSize: "var(--t-sm)",
          color: "var(--ink-4)",
          lineHeight: 1.5,
        }}
      >
        Segmented control — Watch active. Lives between capture-hero and
        capture-panel in the main App window. Persists to prefs.app_mode via
        setPref + emits prefs_changed for cross-window sync.
      </p>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── b + c. layout mocks side by side ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Layout mocks
      </div>
      <div className={styles["mode-layout-pair"]}>
        <LayoutBlock label="Watch" note="overlay-first, system audio.">
          <WatchLayoutMock />
        </LayoutBlock>
        <LayoutBlock label="Meeting" note="sidebar + transcript, mic+system.">
          <MeetingLayoutMock />
        </LayoutBlock>
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── d. cascade rules table ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Cascade rules
      </div>
      <div className={styles["mode-cascade-table"]}>
        <div className={styles["mode-cascade-head"]}>
          <span>Target</span>
          <span>Effect</span>
          <span>Wire status</span>
        </div>
        {CASCADE_ROWS.map((r) => (
          <div key={r.target} className={styles["mode-cascade-row"]}>
            <span
              className="mono"
              style={{ fontSize: "var(--t-xs)", color: "var(--ink-3)" }}
            >
              {r.target}
            </span>
            <span style={{ fontSize: "var(--t-sm)", color: "var(--ink-3)", lineHeight: 1.5 }}>
              {r.effect}
            </span>
            <span
              className="mono"
              style={{
                fontSize: "var(--t-xs)",
                color: r.wired ? "var(--ok)" : "var(--ink-5)",
                fontWeight: r.wired ? 600 : 400,
              }}
            >
              {r.wire}
            </span>
          </div>
        ))}
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── e. voice/transition memo ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Transition memo
      </div>
      <div className={styles["mode-voice-memo"]}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--t-xs)",
            color: "var(--ink-3)",
            lineHeight: 1.7,
          }}
        >
          Mode switch fade: <code>transition: opacity 200ms ease</code> on
          layout container. <strong>Not applied this slice</strong> — deferred
          to chunk B alongside sidebar mount/unmount transition, to avoid
          over-engineering the wire layer before the sidebar shell exists.
          <br />
          Overlay policy = <strong>Option A (storage-only)</strong>: overlay
          does not self-hide on mode switch this slice. Capture target
          (Watch=system, Meeting=mic+system) wired in chunk B (US-005).
        </p>
      </div>

    </DSSection>
  );
}
