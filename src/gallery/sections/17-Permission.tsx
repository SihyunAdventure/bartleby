import styles from "../Gallery.module.css";
import { DSSection } from "../components/DSSection";

/* ── a. 4-state diagram data ── */
interface PermState {
  key: string;
  label: string;
  indicator: string;
  indicatorVariant: "default" | "muted" | "ok";
  voice: string;
  note: string;
}

const PERM_STATES: PermState[] = [
  {
    key: "not-requested",
    label: "NotRequested",
    indicator: "○  Not asked yet",
    indicatorVariant: "muted",
    voice: "",
    note: "아직 요청 전 — first launch",
  },
  {
    key: "granted",
    label: "Granted",
    indicator: "✓  Allowed",
    indicatorVariant: "ok",
    voice: "",
    note: "capture proceeds normally",
  },
  {
    key: "denied",
    label: "Denied",
    indicator: "—  Refused",
    indicatorVariant: "default",
    voice: "Bartleby would prefer not to.",
    note: "user denied in macOS prompt or Settings",
  },
  {
    key: "restricted",
    label: "Restricted",
    indicator: "⊘  System lock",
    indicatorVariant: "muted",
    voice: "Permission is held elsewhere.",
    note: "parental controls / MDM — admin required",
  },
];

/* ── b. permission types ── */
interface PermType {
  name: string;
  plistKey: string;
  required: string;
  denied: string;
}

const PERM_TYPES: PermType[] = [
  {
    name: "Screen Recording",
    plistKey: "NSScreenCaptureUsageDescription",
    required: "Watch + Meeting",
    denied: "캡처 불가 — 'No system audio' 메시지 + Settings 링크",
  },
  {
    name: "Microphone",
    plistKey: "NSMicrophoneUsageDescription",
    required: "Meeting 전용",
    denied: "Watch 모드: 무관. Meeting 모드: 작동 불가 + Settings 링크",
  },
];

/* ── c. Settings.app deeplinks ── */
interface DeeplinkRow {
  perm: string;
  url: string;
  inUse: boolean;
}

const DEEPLINKS: DeeplinkRow[] = [
  {
    perm: "Screen Recording",
    url: "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
    inUse: true,
  },
  {
    perm: "Microphone",
    url: "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
    inUse: true,
  },
  {
    perm: "Camera",
    url: "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera",
    inUse: false,
  },
];

/* ── d. state machine flow ASCII ── */
const FLOW_ASCII = `App start
  → probe_permissions()
      ├─ NotRequested  → Show macOS system prompt → user decides
      │                    ├─ Granted    → capture proceed ✓
      │                    └─ Denied     → PermissionNeeded state
      │                                     → voice copy + ⚙ Open Settings (mock)
      │                                     → "I've granted it" → recheck_permissions()
      ├─ Granted       → capture proceed ✓
      ├─ Denied        → PermissionNeeded state (same graceful path)
      └─ Restricted    → PermissionNeeded + admin contact note
                          voice: "Permission is held elsewhere."`;

/* ── e. mode-specific behavior ── */
interface ModeBehaviorRow {
  mode: string;
  denied: string;
  action: string;
  ok: boolean;
}

const MODE_BEHAVIOR: ModeBehaviorRow[] = [
  {
    mode: "Watch + Screen Recording 거부",
    denied: "Screen Recording",
    action: "'No system audio access' + ⚙ Open Settings",
    ok: false,
  },
  {
    mode: "Watch + Mic 거부",
    denied: "Microphone",
    action: "무관 — overlay 정상 작동 ✓",
    ok: true,
  },
  {
    mode: "Meeting + Screen Recording 거부",
    denied: "Screen Recording",
    action: "캡처 불가 — 'No system audio' + ⚙ Open Settings",
    ok: false,
  },
  {
    mode: "Meeting + Mic 거부",
    denied: "Microphone",
    action: "'Mic 없이는 미팅 모드 미작동' + ⚙ Open Settings",
    ok: false,
  },
  {
    mode: "Watch/Meeting — 모두 Granted",
    denied: "—",
    action: "정상 작동 ✓",
    ok: true,
  },
];

/* ── f. voice copy matrix ── */
interface VoiceRow {
  context: string;
  copy: string;
}

const VOICE_MATRIX: VoiceRow[] = [
  {
    context: "Generic denied",
    copy: "Bartleby would prefer not to.",
  },
  {
    context: "Mic denied",
    copy: "Bartleby would prefer not to listen.",
  },
  {
    context: "Screen Recording denied",
    copy: "Bartleby would prefer not to overhear.",
  },
  {
    context: "Restricted (system lock)",
    copy: "Permission is held elsewhere. (시스템 설정에서 관리자 권한 확인 필요.)",
  },
];

/* ── Section ── */
export function Permission() {
  return (
    <DSSection
      id="permission"
      kicker="17 · Permission Lifecycle"
      title="Permission Lifecycle"
      lede="권한 — 거부도 graceful, 모드별로 다르게."
    >

      {/* ── a. 4-state diagram ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Permission states
      </div>
      <div className={styles["perm-state-grid"]}>
        {PERM_STATES.map((s) => (
          <div key={s.key} className={styles["perm-state-box"]}>
            <div className={styles["perm-state-label"]}>{s.label}</div>
            <div
              className={
                s.indicatorVariant === "muted"
                  ? styles["perm-state-indicator--muted"]
                  : s.indicatorVariant === "ok"
                  ? styles["perm-state-indicator--ok"]
                  : styles["perm-state-indicator"]
              }
              style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-sm)" }}
            >
              {s.indicator}
            </div>
            {s.voice && (
              <div className={styles["perm-state-voice"]}>{s.voice}</div>
            )}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--t-xs)",
                color: "var(--ink-5)",
                marginTop: "var(--s-1)",
              }}
            >
              {s.note}
            </div>
          </div>
        ))}
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── b. permission types table ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Permission types
      </div>
      <div className={styles["perm-type-table"]}>
        <div className={styles["perm-type-head"]}>
          <span>Permission</span>
          <span>Info.plist Key</span>
          <span>Required in</span>
          <span>Denied behavior</span>
        </div>
        {PERM_TYPES.map((r) => (
          <div key={r.name} className={styles["perm-type-row"]}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)", color: "var(--ink-2)", fontWeight: 500 }}>
              {r.name}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)", color: "var(--ink-4)" }}>
              {r.plistKey}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)", color: "var(--ink-3)" }}>
              {r.required}
            </span>
            <span style={{ fontSize: "var(--t-sm)", color: "var(--ink-3)", lineHeight: 1.5 }}>
              {r.denied}
            </span>
          </div>
        ))}
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── c. Settings.app deeplinks ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Settings.app deeplinks (macOS)
      </div>
      <div className={styles["perm-deeplink-table"]}>
        <div className={styles["perm-deeplink-head"]}>
          <span>Permission</span>
          <span>URL</span>
          <span>In use</span>
        </div>
        {DEEPLINKS.map((r) => (
          <div key={r.perm} className={styles["perm-deeplink-row"]}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)", color: "var(--ink-3)" }}>
              {r.perm}
            </span>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)", color: "var(--ink-2)", wordBreak: "break-all" }}>
              {r.url}
            </code>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--t-xs)",
                color: r.inUse ? "var(--ok)" : "var(--ink-5)",
                fontWeight: r.inUse ? 600 : 400,
              }}
            >
              {r.inUse ? "✓" : "—"}
            </span>
          </div>
        ))}
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── d. state machine flow ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        State machine flow
      </div>
      <div className={styles["perm-flow-block"]}>
        <pre className={styles["perm-flow-pre"]}>{FLOW_ASCII}</pre>
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── e. mode-specific behavior ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Mode-specific behavior
      </div>
      <div className={styles["perm-mode-table"]}>
        <div className={styles["perm-mode-head"]}>
          <span>Scenario</span>
          <span>Denied permission</span>
          <span>Behavior</span>
        </div>
        {MODE_BEHAVIOR.map((r) => (
          <div key={r.mode} className={`${styles["perm-mode-row"]}${r.ok ? ` ${styles["perm-mode-row--ok"]}` : ""}`}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)", color: "var(--ink-3)" }}>
              {r.mode}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)", color: "var(--ink-4)" }}>
              {r.denied}
            </span>
            <span
              className={styles["perm-mode-action"]}
              style={{ fontSize: "var(--t-sm)", color: r.ok ? "var(--ok)" : "var(--ink-2)", lineHeight: 1.5 }}
            >
              {r.action}
            </span>
          </div>
        ))}
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── f. voice copy matrix ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Voice copy matrix
      </div>
      <div className={styles["perm-voice-matrix"]}>
        {VOICE_MATRIX.map((r) => (
          <div key={r.context} className={styles["perm-voice-row"]}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-xs)", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "var(--tracking-wider)" }}>
              {r.context}
            </span>
            <span className={styles["perm-voice-copy"]}>{r.copy}</span>
          </div>
        ))}
      </div>

    </DSSection>
  );
}
