import styles from "../Gallery.module.css";
import { DSSection } from "../components/DSSection";

/* ── Sample transcript data ── */
const SAMPLE_EN_FINAL = "The meeting started at ten. We discussed Q2 targets.";
const SAMPLE_EN_PARTIAL = "Next steps are";
const SAMPLE_KO_FINAL = "회의는 열 시에 시작됐습니다. 2분기 목표를 논의했습니다.";
const SAMPLE_KO_PARTIAL = "다음 단계는";

/* ── Caption mock primitive — mirrors Overlay rgba/sizes exactly ── */
interface CaptionMockProps {
  enFinal?: string;
  enPartial?: string;
  koFinal?: string;
  koPartial?: string;
  showEn?: boolean;
  showKo?: boolean;
  bgAlpha?: number;
  koFontSize?: number;
  stateLabel?: string;
  stateNote?: string;
}

function CaptionMock({
  enFinal = "",
  enPartial = "",
  koFinal = "",
  koPartial = "",
  showEn = true,
  showKo = true,
  bgAlpha = 0.85,
  koFontSize = 16,
  stateLabel,
  stateNote,
}: CaptionMockProps) {
  const hasEn = enFinal.length > 0 || enPartial.length > 0;
  const hasKo = koFinal.length > 0 || koPartial.length > 0;
  const hasAny = hasEn || hasKo;

  return (
    <div className={styles["caption-mock-wrap"]}>
      {stateLabel && (
        <div className={styles["caption-mock-label"]}>
          <span className="eyebrow">{stateLabel}</span>
          {stateNote && (
            <span className={styles["caption-mock-note"]}>{stateNote}</span>
          )}
        </div>
      )}
      <div
        className={styles["caption-mock-frame"]}
        style={{
          background: `rgba(248, 247, 244, ${bgAlpha})`,
          backdropFilter: "blur(12px)",
        }}
      >
        {hasAny ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
            {showEn && (
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(40, 40, 40, 0.55)",
                  lineHeight: 1.35,
                  minHeight: "1.35em",
                }}
              >
                {enFinal}
                {enPartial && (
                  <span style={{ opacity: 0.7 }}>
                    {enFinal ? " " : ""}
                    {enPartial}
                  </span>
                )}
              </div>
            )}
            {showKo && (
              <div
                style={{
                  fontSize: koFontSize,
                  color: "rgba(15, 15, 15, 0.92)",
                  lineHeight: 1.45,
                  fontWeight: 400,
                  minHeight: "1.45em",
                }}
              >
                {koFinal}
                {koPartial && (
                  <span style={{ opacity: 0.65, transition: "opacity 200ms ease" }}>
                    {koFinal ? " " : ""}
                    {koPartial}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Placeholder / state mock — passed as enFinal when needed */
          null
        )}
      </div>
    </div>
  );
}

/* ── State mock — for non-caption states ── */
interface StateMockProps {
  stateLabel: string;
  stateNote?: string;
  bgAlpha?: number;
  children: React.ReactNode;
}

function StateMock({ stateLabel, stateNote, bgAlpha = 0.85, children }: StateMockProps) {
  return (
    <div className={styles["caption-mock-wrap"]}>
      <div className={styles["caption-mock-label"]}>
        <span className="eyebrow">{stateLabel}</span>
        {stateNote && (
          <span className={styles["caption-mock-note"]}>{stateNote}</span>
        )}
      </div>
      <div
        className={styles["caption-mock-frame"]}
        style={{
          background: `rgba(248, 247, 244, ${bgAlpha})`,
          backdropFilter: "blur(12px)",
          fontStyle: "italic",
          fontSize: 13,
          color: "rgba(40, 40, 40, 0.6)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Spec row ── */
const specRows = [
  {
    layer: "English (source)",
    prop: "fontSize",
    specValue: "11px",
    liveValue: "11 (hardcoded)",
    match: true,
  },
  {
    layer: "English",
    prop: "color",
    specValue: "rgba(40,40,40,0.55)",
    liveValue: "rgba(40,40,40,0.55)",
    match: true,
  },
  {
    layer: "English",
    prop: "lineHeight / minHeight",
    specValue: "1.35 / 1.35em",
    liveValue: "1.35 / 1.35em",
    match: true,
  },
  {
    layer: "Korean (translation)",
    prop: "fontSize",
    specValue: "prefs.caption_font_size (14–18px)",
    liveValue: "captionFontSize (same)",
    match: true,
  },
  {
    layer: "Korean",
    prop: "color",
    specValue: "rgba(15,15,15,0.92)",
    liveValue: "rgba(15,15,15,0.92)",
    match: true,
  },
  {
    layer: "Korean",
    prop: "lineHeight / minHeight",
    specValue: "1.45 / 1.45em",
    liveValue: "1.45 / 1.45em",
    match: true,
  },
  {
    layer: "KO partial",
    prop: "opacity",
    specValue: "0.65",
    liveValue: "0.65",
    match: true,
  },
  {
    layer: "Container",
    prop: "background",
    specValue: "rgba(248,247,244, bgAlpha)",
    liveValue: "rgba(248,247,244, bgAlpha)",
    match: true,
  },
  {
    layer: "Container",
    prop: "backdropFilter",
    specValue: "blur(12px)",
    liveValue: "blur(12px)",
    match: true,
  },
  {
    layer: "Container",
    prop: "borderRadius",
    specValue: "6px",
    liveValue: "6 (unitless — React infers px)",
    match: true,
  },
  {
    layer: "Container",
    prop: "padding",
    specValue: "10px 14px",
    liveValue: "\"10px 14px\"",
    match: true,
  },
  {
    layer: "Layer gap",
    prop: "gap (flex column)",
    specValue: "4px",
    liveValue: "4 (unitless — React infers px)",
    match: true,
  },
];

/* ── Section ── */
export function LiveCaption() {
  return (
    <DSSection
      id="livecaption"
      kicker="11 · LiveCaption"
      title="Caption surface spec."
      lede="오버레이 자막 — 한국어가 본문, 영어가 그림자."
    >

      {/* ── a. caption_mode 3 모드 비교 ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        caption_mode variants
      </div>
      <div className={styles["caption-mode-row"]}>
        <CaptionMock
          enFinal={SAMPLE_EN_FINAL}
          koFinal={SAMPLE_KO_FINAL}
          showEn={false}
          showKo={true}
          stateLabel="ko"
          stateNote="Korean only"
        />
        <CaptionMock
          enFinal={SAMPLE_EN_FINAL}
          koFinal={SAMPLE_KO_FINAL}
          showEn={true}
          showKo={true}
          stateLabel="ko_en"
          stateNote="default — EN small + KO large"
        />
        <CaptionMock
          enFinal={SAMPLE_EN_FINAL}
          koFinal={SAMPLE_KO_FINAL}
          showEn={true}
          showKo={false}
          stateLabel="en"
          stateNote="English only"
        />
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── b. overlay_opacity 4 단계 ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        overlay_opacity ramp
      </div>
      <div className={styles["caption-opacity-row"]}>
        {[0.60, 0.75, 0.85, 1.00].map((alpha) => (
          <CaptionMock
            key={alpha}
            enFinal={SAMPLE_EN_FINAL}
            koFinal={SAMPLE_KO_FINAL}
            showEn={true}
            showKo={true}
            bgAlpha={alpha}
            stateLabel={`${Math.round(alpha * 100)}%`}
            stateNote="background alpha"
          />
        ))}
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── c. caption_font_size 비교 ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        caption_font_size (KO layer)
      </div>
      <div className={styles["caption-fontsize-col"]}>
        {[14, 15, 16, 17, 18].map((sz) => (
          <CaptionMock
            key={sz}
            enFinal={SAMPLE_EN_FINAL}
            koFinal={SAMPLE_KO_FINAL}
            showEn={true}
            showKo={true}
            koFontSize={sz}
            stateLabel={`${sz}px`}
            stateNote={sz === 16 ? "default" : undefined}
          />
        ))}
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── d. Caption state matrix ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Caption state matrix
      </div>
      <div className={styles["caption-state-grid"]}>
        {/* awaiting */}
        <StateMock stateLabel="awaiting" stateNote="default idle">
          Awaiting English audio.
        </StateMock>

        {/* drm-blocked */}
        <StateMock stateLabel="drm-blocked" stateNote="muted / DRM / paused">
          No audio detected.
        </StateMock>

        {/* stt-error */}
        <StateMock stateLabel="stt-error" stateNote="Whisper / Soniox error">
          <span style={{ fontFamily: '"Cormorant Garamond", ui-serif, Georgia, serif', fontSize: 13, fontStyle: "italic" }}>
            Bartleby would prefer not to. (Connection lost)
          </span>
        </StateMock>

        {/* partial EN in progress */}
        <CaptionMock
          enFinal={SAMPLE_EN_FINAL}
          enPartial={SAMPLE_EN_PARTIAL}
          showEn={true}
          showKo={false}
          stateLabel="partial"
          stateNote="EN streaming, no KO yet"
        />

        {/* final + KO partial mid-state */}
        <CaptionMock
          enFinal={SAMPLE_EN_FINAL}
          koFinal={SAMPLE_KO_FINAL}
          koPartial={SAMPLE_KO_PARTIAL}
          showEn={true}
          showKo={true}
          stateLabel="final + KO partial"
          stateNote="mid-stream translation"
        />

        {/* translation-error */}
        <div className={styles["caption-mock-wrap"]}>
          <div className={styles["caption-mock-label"]}>
            <span className="eyebrow">translation-error</span>
            <span className={styles["caption-mock-note"]}>KO layer stalled</span>
          </div>
          <div
            className={styles["caption-mock-frame"]}
            style={{
              background: "rgba(248, 247, 244, 0.85)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
              <div style={{ fontSize: 11, color: "rgba(40, 40, 40, 0.55)", lineHeight: 1.35, minHeight: "1.35em" }}>
                {SAMPLE_EN_FINAL}
              </div>
              <div style={{ fontSize: 16, color: "rgba(15, 15, 15, 0.92)", lineHeight: 1.45, minHeight: "1.45em" }}>
                <span style={{ fontSize: 11, fontStyle: "italic", color: "rgba(40, 40, 40, 0.55)", fontFamily: '"Cormorant Garamond", ui-serif, Georgia, serif' }}>
                  Bartleby would prefer not to translate that.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* all-flowing happy state */}
        <CaptionMock
          enFinal={SAMPLE_EN_FINAL}
          enPartial={SAMPLE_EN_PARTIAL}
          koFinal={SAMPLE_KO_FINAL}
          koPartial={SAMPLE_KO_PARTIAL}
          showEn={true}
          showKo={true}
          stateLabel="all-flowing"
          stateNote="happy path — both layers streaming"
        />
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── e. Spec mapping memo ── */}
      <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>
        Spec mapping — App.tsx::Overlay inline styles
      </div>
      <div className={styles["spec-table"]}>
        <div className={styles["spec-table-head"]}>
          <span>Layer</span>
          <span>Property</span>
          <span>Spec value</span>
          <span>Live value</span>
          <span>Match</span>
        </div>
        {specRows.map((r, i) => (
          <div key={i} className={styles["spec-table-row"]}>
            <span
              className="mono"
              style={{ fontSize: "var(--t-xs)", color: "var(--ink-3)" }}
            >
              {r.layer}
            </span>
            <span
              className="mono"
              style={{ fontSize: "var(--t-xs)", color: "var(--ink-4)" }}
            >
              {r.prop}
            </span>
            <span
              className="mono"
              style={{ fontSize: "var(--t-xs)", color: "var(--ink-2)" }}
            >
              {r.specValue}
            </span>
            <span
              className="mono"
              style={{ fontSize: "var(--t-xs)", color: "var(--ink-3)" }}
            >
              {r.liveValue}
            </span>
            <span
              className="mono"
              style={{
                fontSize: "var(--t-xs)",
                color: r.match ? "var(--ok)" : "var(--danger)",
                fontWeight: 600,
              }}
            >
              {r.match ? "✓" : "drift"}
            </span>
          </div>
        ))}
      </div>
      <p
        style={{
          margin: "var(--s-4) 0 0",
          fontSize: "var(--t-sm)",
          color: "var(--ink-4)",
          lineHeight: 1.5,
        }}
      >
        No drift detected as of slice §11. All live inline values match spec. The only
        unitless values (borderRadius: 6, gap: 4) are React shorthand — browsers resolve
        them to px.
      </p>
    </DSSection>
  );
}
