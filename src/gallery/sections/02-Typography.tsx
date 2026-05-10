import styles from "../Gallery.module.css";
import { DSSection } from "../components/DSSection";

interface WeightSpec {
  label: string;
  weight: number;
  italic?: boolean;
}

interface FontFamily {
  family: string;
  role: string;
  cls: string;
  specimen_en: string;
  specimen_ko: string;
  weights: WeightSpec[];
}

/* ── Font family specimens ── */
const fontFamilies: FontFamily[] = [
  {
    family: "Pretendard",
    role: "Body sans · UI · Caption",
    cls: "",
    specimen_en: "Bartleby takes notes so you don't have to.",
    specimen_ko: "바틀비가 받아 적습니다 — 미팅부터 여백의 말까지.",
    weights: [
      { label: "400 Regular",  weight: 400 },
      { label: "500 Medium",   weight: 500 },
      { label: "600 SemiBold", weight: 600 },
      { label: "700 Bold",     weight: 700 },
    ],
  },
  {
    family: "Gowun Batang",
    role: "Note body · Korean serif",
    cls: "ko-serif",
    specimen_en: "",
    specimen_ko: "사람의 말은 제각각 다르다. 받아 적는 것이 먼저다.",
    weights: [
      { label: "400 Regular", weight: 400 },
      { label: "700 Bold",    weight: 700 },
    ],
  },
  {
    family: "Cormorant Garamond",
    role: "Voice · Epigraph · Italic",
    cls: "serif-quote",
    specimen_en: '“I would prefer not to.” — Bartleby, the Scrivener',
    specimen_ko: "",
    weights: [
      { label: "400 Regular",       weight: 400, italic: false },
      { label: "400 Italic",        weight: 400, italic: true  },
      { label: "500 Medium Italic", weight: 500, italic: true  },
    ],
  },
  {
    family: "JetBrains Mono / D2Coding",
    role: "Mono · Chrome · Code · Eyebrow",
    cls: "mono",
    specimen_en: "ts_0xBEEF · fn bartleby() → Note",
    specimen_ko: "함수명 · 타임스탬프 · 코드",
    weights: [
      { label: "400 Regular", weight: 400 },
      { label: "500 Medium",  weight: 500 },
    ],
  },
];

/* ── Type scale ── */
const typeScale = [
  { token: "--t-xs",   px: "11px", lh: "16px" },
  { token: "--t-sm",   px: "12px", lh: "18px" },
  { token: "--t-base", px: "13px", lh: "20px" },
  { token: "--t-md",   px: "15px", lh: "22px" },
  { token: "--t-lg",   px: "18px", lh: "26px" },
  { token: "--t-xl",   px: "22px", lh: "30px" },
  { token: "--t-2xl",  px: "28px", lh: "36px" },
  { token: "--t-3xl",  px: "36px", lh: "44px" },
  { token: "--t-4xl",  px: "48px", lh: "56px" },
  { token: "--t-5xl",  px: "64px", lh: "72px" },
];

/* ── Tracking samples ── */
const trackingSamples = [
  { token: "--tracking-tight",  label: "tight  −0.02em", value: "var(--tracking-tight)"  },
  { token: "--tracking-normal", label: "normal  0",           value: "var(--tracking-normal)" },
  { token: "--tracking-wide",   label: "wide  +0.04em",       value: "var(--tracking-wide)"   },
  { token: "--tracking-wider",  label: "wider  +0.12em",      value: "var(--tracking-wider)"  },
];

/* ── Font role map ── */
const fontRoles = [
  {
    eyebrow: "Pretendard",
    desc: "Live caption · UI labels · body sans. Latin + Hangul 동시 커버. 기본 본문 폰트.",
  },
  {
    eyebrow: "Gowun Batang",
    desc: "노트 본문 serif. 긴 한국어 텍스트의 가독성. 에피그래프 한글 버전에도 사용.",
  },
  {
    eyebrow: "Cormorant Garamond",
    desc: "Voice layer — italics, pull quotes, epigraphs. Bartleby 의 literary 톤을 담당.",
  },
  {
    eyebrow: "JetBrains Mono / D2Coding",
    desc: "Mono chrome — eyebrow labels, timestamps, code spans. D2Coding is system fallback for Hangul.",
  },
];

export function Typography() {
  return (
    <DSSection
      id="typography"
      kicker="02 · Typography"
      title="Four voices, one manuscript."
      lede="네 폰트 — Pretendard 가 본진, Cormorant 가 literary voice, Gowun Batang 이 한국 본문, JetBrains Mono / D2Coding 이 chrome mono."
    >
      {/* ── 1. Font family specimens ── */}
      <div className={styles["type-families"]}>
        {fontFamilies.map((f) => (
          <div key={f.family} className={styles["type-family-row"]}>
            <div className={styles["type-family-meta"]}>
              <div className="eyebrow" style={{ marginBottom: "var(--s-1)" }}>{f.family}</div>
              <div
                className="mono"
                style={{ fontSize: "var(--t-xs)", color: "var(--ink-4)" }}
              >
                {f.role}
              </div>
            </div>
            <div className={styles["type-family-specimens"]}>
              {f.weights.map((w) => (
                <div key={w.label} className={styles["type-specimen-item"]}>
                  <div
                    className="eyebrow"
                    style={{ marginBottom: "var(--s-1)", color: "var(--ink-5)" }}
                  >
                    {w.label}
                  </div>
                  <div
                    className={f.cls}
                    style={{
                      fontWeight: w.weight,
                      fontStyle: w.italic ? "italic" : "normal",
                      fontSize: "var(--t-lg)",
                      lineHeight: "var(--lh-lg)",
                      color: "var(--ink-2)",
                    }}
                  >
                    {f.specimen_en && <span>{f.specimen_en}</span>}
                    {f.specimen_en && f.specimen_ko && " "}
                    {f.specimen_ko && (
                      <span className={f.cls === "mono" ? "ko-mono" : "ko"}>
                        {f.specimen_ko}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── 2. Type scale ── */}
      <div>
        <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>Type scale</div>
        <div className={styles["type-scale-table"]}>
          {typeScale.map((row) => (
            <div key={row.token} className={styles["type-scale-row"]}>
              <div
                className="mono tabular"
                style={{ fontSize: "var(--t-xs)", color: "var(--ink-4)", whiteSpace: "nowrap" }}
              >
                {row.token}
              </div>
              <div
                className="mono tabular"
                style={{ fontSize: "var(--t-xs)", color: "var(--ink-5)", whiteSpace: "nowrap" }}
              >
                {row.px} / {row.lh}
              </div>
              <div
                style={{
                  fontSize: `var(${row.token})`,
                  lineHeight: `var(${row.token.replace("--t-", "--lh-")})`,
                  color: "var(--ink-2)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                Bartleby
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── 3. Tracking ── */}
      <div>
        <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>Letter-spacing</div>
        <div className={styles["type-tracking-rows"]}>
          {trackingSamples.map((t) => (
            <div key={t.token} className={styles["type-tracking-item"]}>
              <div
                className="mono tabular"
                style={{
                  fontSize: "var(--t-xs)",
                  color: "var(--ink-4)",
                  width: 180,
                  flexShrink: 0,
                }}
              >
                {t.label}
              </div>
              <div
                className="display"
                style={{
                  letterSpacing: t.value,
                  fontSize: "var(--t-2xl)",
                  lineHeight: "var(--lh-2xl)",
                  color: "var(--ink)",
                }}
              >
                BARTLEBY
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="hr" style={{ margin: "var(--s-10) 0" }} />

      {/* ── 4. Font role map ── */}
      <div>
        <div className="eyebrow" style={{ marginBottom: "var(--s-4)" }}>Font roles</div>
        <div className={styles["font-role-grid"]}>
          {fontRoles.map((r) => (
            <div key={r.eyebrow} className={styles["font-role-item"]}>
              <div className="eyebrow" style={{ marginBottom: "var(--s-2)" }}>{r.eyebrow}</div>
              <p
                className="kr-leading"
                style={{
                  margin: 0,
                  fontSize: "var(--t-sm)",
                  lineHeight: 1.55,
                  color: "var(--ink-3)",
                }}
              >
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </DSSection>
  );
}
