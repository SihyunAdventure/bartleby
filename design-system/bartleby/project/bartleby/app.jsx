/* global React, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSlider, TweakColor,
   Btn, IconBtn, Toggle, Check, Badge, Meter, RecButton, Field, KeyInput, Segmented, Swatch,
   DSSection, Demo, VoiceCard, LibraryScreen, RecordingScreen */
const { useState: useStateApp2, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "typePairing": "mono-sans",
  "accent": "#1a1a1a",
  "characterIntensity": 75,
  "dark": false
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#1a1a1a', '#c9402a', '#3a5a8c', '#7a6b4f'];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // apply tweaks to root
  useEffectApp(() => {
    const r = document.documentElement;
    r.dataset.theme = t.dark ? 'dark' : 'light';
    r.style.setProperty('--accent', t.accent);
    r.style.setProperty('--accent-soft', hexToSoft(t.accent, t.dark ? 0.18 : 0.10));

    // Type pairing
    if (t.typePairing === 'mono-sans') {
      r.style.setProperty('--font-display', '"JetBrains Mono", ui-monospace, Menlo, monospace');
    } else if (t.typePairing === 'serif-sans') {
      r.style.setProperty('--font-display', '"Cormorant Garamond", "EB Garamond", ui-serif, Georgia, serif');
    } else {
      r.style.setProperty('--font-display', '"Inter", -apple-system, sans-serif');
    }
  }, [t]);

  return (
    <div className="ds-page" data-character={t.characterIntensity > 50 ? 'high' : 'low'}>
      <Hero intensity={t.characterIntensity} />
      <Manifesto intensity={t.characterIntensity} />
      <ColorTokens />
      <TypeScale />
      <SpacingShadow />
      <ButtonGallery />
      <FormGallery />
      <RecordingStates />
      <BadgeGallery />
      <DomainBlocks />
      <SidebarPattern />
      <VoiceLibrary intensity={t.characterIntensity} />
      <AppliedScreens />
      <AppIcon />
      <Marketing />
      <Footer />

      <TweaksPanel title="Bartleby tweaks">
        <TweakSection label="Type" />
        <TweakRadio
          label="Display"
          value={t.typePairing}
          options={[
            { value: 'mono-sans', label: 'Mono' },
            { value: 'serif-sans', label: 'Serif' },
            { value: 'all-sans', label: 'Sans' },
          ]}
          onChange={(v) => setTweak('typePairing', v)}
        />
        <TweakSection label="Color" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakSection label="Character" />
        <TweakSlider
          label="Bartleby intensity"
          value={t.characterIntensity}
          min={0} max={100} step={5} unit="%"
          onChange={(v) => setTweak('characterIntensity', v)}
        />
      </TweaksPanel>
    </div>
  );
}

function hexToSoft(hex, a = 0.1) {
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ─────────────── Hero ─────────────── */
function Hero({ intensity }) {
  const showLiterary = intensity > 50;
  return (
    <header className="hero">
      <div className="hero-rule" />
      <div className="hero-grid">
        <div className="hero-meta col gap-3">
          <div className="eyebrow">Design System · v0.1 · 2026</div>
          <div className="eyebrow">Mac · Tauri · Korean-first</div>
        </div>
        <div className="hero-title-block">
          <h1 className="hero-title display">bartleby</h1>
          {showLiterary && (
            <div className="serif-quote hero-epigraph">
              "I would prefer not to take notes."
            </div>
          )}
          <div className="hero-sub">
            A meeting scrivener for Mac. Cloud-powered. Locally owned.<br/>
            <span className="ko">받아 적기 싫은 미팅까지 바틀비가 받아 적습니다.</span>
          </div>
        </div>
        <div className="hero-meta col gap-2" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
          <div className="eyebrow">heybartleby.com</div>
          <div className="eyebrow">@heybartleby</div>
        </div>
      </div>
      <div className="hero-rule" />
      <nav className="hero-toc">
        {['colors','typography','spacing','buttons','forms','recording','badges','blocks','sidebar','voice','screens','icon','marketing'].map((s,i) => (
          <a key={s} href={`#${s}`} className="mono">
            <span className="tabular">{String(i+1).padStart(2,'0')}</span>&nbsp;&nbsp;{s}
          </a>
        ))}
      </nav>
      <div className="hero-rule" />
    </header>
  );
}

/* ─────────────── Manifesto ─────────────── */
function Manifesto({ intensity }) {
  return (
    <DSSection id="manifesto" kicker="00 · Manifesto" title="A scrivener, not an assistant.">
      <div className="manifesto-grid">
        <div>
          <p className="manifesto-p">
            Bartleby is named for Melville's copy-clerk — the one who, when asked to do
            anything beyond his copying, would politely reply: <em>"I would prefer not to."</em>
          </p>
          <p className="manifesto-p">
            Our Bartleby has the opposite affliction. He <em>insists</em> on copying — every
            meeting, every aside, every half-finished sentence — so that you may prefer not to.
          </p>
        </div>
        <div className="manifesto-rules">
          <div className="rule-item">
            <div className="eyebrow">Restraint</div>
            <p>Two fonts. One ink. No gradients. No mascots.</p>
          </div>
          <div className="rule-item">
            <div className="eyebrow">Paper</div>
            <p>The surface is paper, not glass. Aged ivory. Hairline rules.</p>
          </div>
          <div className="rule-item">
            <div className="eyebrow">Voice</div>
            <p>Polite, slightly archaic, faintly ironic. Never cute.</p>
          </div>
          <div className="rule-item">
            <div className="eyebrow">Korean-first</div>
            <p>한글이 1등 시민. Pretendard for body, mono for chrome.</p>
          </div>
        </div>
      </div>
    </DSSection>
  );
}

/* ─────────────── Colors ─────────────── */
function ColorTokens() {
  const paper = ['paper','paper-2','paper-3','paper-edge','rule','rule-strong'];
  const ink   = ['ink','ink-2','ink-3','ink-4','ink-5','ink-6'];
  const status= ['rec','ok','warn','danger'];

  return (
    <DSSection id="colors" kicker="01 · Color" title="Paper & ink." lede="Pure neutrals (chroma 0). Warm-paper light, ink-black dark. Status colors are the only saturation in the system, used sparingly.">
      <div className="ds-color-blocks">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Surfaces — paper</div>
          <div className="swatch-grid">
            {paper.map(n => <Swatch key={n} name={n} varName={`--${n}`} />)}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Foreground — ink</div>
          <div className="swatch-grid">
            {ink.map(n => <Swatch key={n} name={n} varName={`--${n}`} />)}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Status</div>
          <div className="swatch-grid">
            {status.map(n => <Swatch key={n} name={n} varName={`--${n}`} />)}
          </div>
        </div>
      </div>

      <div className="theme-pair">
        <div className="theme-card">
          <div className="theme-strip" style={{ background: 'oklch(98.2% 0.005 85)' }}>
            <span className="dot" style={{ background: 'oklch(18% 0 0)' }} />
            <span className="mono">light · paper</span>
          </div>
          <div className="theme-card-body" style={{ background: 'oklch(98.2% 0.005 85)', color: 'oklch(18% 0 0)' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>Bartleby</div>
            <div style={{ fontSize: 12, color: 'oklch(42% 0 0)', marginTop: 4 }}>The default surface. Aged ivory.</div>
          </div>
        </div>
        <div className="theme-card">
          <div className="theme-strip" style={{ background: 'oklch(15.5% 0.003 250)', color: 'oklch(96% 0 0)' }}>
            <span className="dot" style={{ background: 'oklch(96% 0 0)' }} />
            <span className="mono">dark · ink</span>
          </div>
          <div className="theme-card-body" style={{ background: 'oklch(15.5% 0.003 250)', color: 'oklch(96% 0 0)' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>Bartleby</div>
            <div style={{ fontSize: 12, color: 'oklch(72% 0 0)', marginTop: 4 }}>For night sessions. Slightly cool ink.</div>
          </div>
        </div>
      </div>
    </DSSection>
  );
}

/* ─────────────── Type ─────────────── */
function TypeScale() {
  const sizes = [
    ['display.5xl', 'var(--t-5xl)/var(--lh-5xl)', '64/72', 'Marketing hero — rare'],
    ['display.4xl', 'var(--t-4xl)/var(--lh-4xl)', '48/56', 'Landing pages'],
    ['display.3xl', 'var(--t-3xl)/var(--lh-3xl)', '36/44', 'Section title'],
    ['display.2xl', 'var(--t-2xl)/var(--lh-2xl)', '28/36', 'Page title'],
    ['display.xl',  'var(--t-xl)/var(--lh-xl)',   '22/30', 'Subhead'],
    ['body.lg',     'var(--t-lg)/var(--lh-lg)',   '18/26', 'Lede'],
    ['body.md',     'var(--t-md)/var(--lh-md)',   '15/22', 'Reading body'],
    ['body.base',   'var(--t-base)/var(--lh-base)','13/20', 'UI default'],
    ['body.sm',     'var(--t-sm)/var(--lh-sm)',   '12/18', 'Secondary'],
    ['body.xs',     'var(--t-xs)/var(--lh-xs)',   '11/16', 'Labels, captions'],
  ];
  return (
    <DSSection id="typography" kicker="02 · Typography" title="Mono display, Sans body — in two scripts." lede="Each English family is paired 1:1 with a Korean companion that matches its weight and tonal voice. The ladder below shows EN and KO at the same size — confirm visual parity at every step.">
      <div className="type-table">
        {sizes.map(([name, sz, px, role]) => {
          const [s, l] = sz.split('/');
          const isMono = name.startsWith('display');
          return (
            <div key={name} className="type-row type-row-bilingual">
              <div className="type-spec mono">
                <div style={{ color: 'var(--ink)' }}>{name}</div>
                <div className="tabular" style={{ color: 'var(--ink-4)' }}>{px}</div>
                <div style={{ color: 'var(--ink-4)', fontStyle: 'italic', fontFamily: 'ui-serif, Georgia, serif' }}>{role}</div>
              </div>
              <div className="type-sample" style={{ fontSize: s, lineHeight: l, fontFamily: isMono ? 'var(--font-display)' : 'var(--font-body)', fontWeight: 500, color: 'var(--ink)' }}>
                {isMono ? 'Bartleby prefers' : 'I would prefer not to.'}
              </div>
              <div className="type-sample ko" style={{ fontSize: s, lineHeight: `calc(${l} * 1.05)`, fontFamily: isMono ? '"Pretendard", var(--font-display)' : 'var(--font-body-kr)', fontWeight: isMono ? 600 : 500, color: 'var(--ink)', letterSpacing: '-0.005em' }}>
                {isMono ? '바틀비가 받아 적습니다' : '받아 적기 싫은 미팅까지'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ds-grid-3" style={{ marginTop: 32, gap: 16 }}>
        <div className="type-pair-cell">
          <div className="eyebrow">EN sans · Inter</div>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', margin: '8px 0 0', fontFamily: 'var(--font-body)' }}>
            The lawyer hired Bartleby to copy legal documents. He copied for several days, then began to refuse other tasks.
          </p>
        </div>
        <div className="type-pair-cell">
          <div className="eyebrow">KR sans · Pretendard</div>
          <p className="ko" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)', margin: '8px 0 0' }}>
            바틀비는 변호사 사무실에서 필사 일을 했다. 며칠 동안 성실히 베껴 적은 후, 그는 모든 다른 요청을 정중히 거절했다.
          </p>
        </div>
        <div className="type-pair-cell">
          <div className="eyebrow">KR serif · Gowun Batang</div>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--ink-2)', margin: '8px 0 0', fontFamily: '"Gowun Batang", "Nanum Myeongjo", serif' }}>
            "그렇게 하지 않는 편이 낫겠습니다." 바틀비는 그렇게 답했다. 변호사는 한참 동안 그 자리에 서 있었다.
          </p>
        </div>
        <div className="type-pair-cell">
          <div className="eyebrow">EN mono · JetBrains Mono</div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', margin: '8px 0 0', fontFamily: 'var(--font-mono)' }}>
            00:14 → Yujin (KO)<br/>00:31 → Sihyun (EN)<br/>01:02 → Yujin (KO) ▍
          </p>
        </div>
        <div className="type-pair-cell">
          <div className="eyebrow">KR mono · D2Coding</div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-2)', margin: '8px 0 0', fontFamily: '"D2Coding", monospace' }}>
            00:14 → 유진 (KO)<br/>00:31 → 시현 (EN)<br/>01:02 → 유진 (KO) ▍
          </p>
        </div>
        <div className="type-pair-cell">
          <div className="eyebrow">KR display · Pretendard 600</div>
          <p className="ko" style={{ fontSize: 28, lineHeight: 1.2, color: 'var(--ink)', margin: '8px 0 0', fontWeight: 600, letterSpacing: '-0.02em' }}>
            바틀비가<br/>받아 적습니다.
          </p>
        </div>
      </div>

      <div className="bilingual-pairing">
        <div className="eyebrow" style={{ marginBottom: 16 }}>1:1 Pairing chart</div>
        <table className="pair-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>English</th>
              <th>Korean</th>
              <th>Sample</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Display / chrome</td>
              <td className="mono">JetBrains Mono · 500</td>
              <td className="mono">Pretendard · 600 (D2Coding for code)</td>
              <td><span className="mono" style={{ color: 'var(--ink)', fontSize: 18 }}>bartleby</span> &nbsp;·&nbsp; <span className="ko" style={{ color: 'var(--ink)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>바틀비</span></td>
            </tr>
            <tr>
              <td>Body sans</td>
              <td className="mono">Inter · 400/500</td>
              <td className="mono">Pretendard · 400/500</td>
              <td><span style={{ fontFamily: 'Inter' }}>I would prefer not to.</span> &nbsp;·&nbsp; <span className="ko">받아 적기 싫은 미팅까지.</span></td>
            </tr>
            <tr>
              <td>Body serif (epigraph)</td>
              <td className="mono">Cormorant Garamond · italic</td>
              <td className="mono">Gowun Batang · regular</td>
              <td><em style={{ fontFamily: 'Cormorant Garamond, serif' }}>I prefer not to.</em> &nbsp;·&nbsp; <span style={{ fontFamily: '"Gowun Batang", "Nanum Myeongjo", serif' }}>그렇게 하지 않는 편이 낫겠습니다.</span></td>
            </tr>
            <tr>
              <td>Mono · timestamps, code</td>
              <td className="mono">JetBrains Mono</td>
              <td className="mono">D2Coding</td>
              <td><span className="mono">00:31 →</span> &nbsp;·&nbsp; <span style={{ fontFamily: 'D2Coding, monospace' }}>00:31 → 유진</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </DSSection>
  );
}

/* ─────────────── Spacing / Radius / Shadow ─────────────── */
function SpacingShadow() {
  const spacing = [['1','4'],['2','8'],['3','12'],['4','16'],['5','20'],['6','24'],['8','32'],['10','40'],['12','48'],['16','64']];
  const radii = [['xs','2'],['sm','4'],['md','6'],['lg','10'],['xl','14'],['2xl','20']];
  const shadows = ['shadow-1','shadow-2','shadow-3','shadow-4'];
  return (
    <DSSection id="spacing" kicker="03 · Spacing · Radius · Elevation" title="A 4pt rhythm and four levels of shadow.">
      <div className="ds-three">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Spacing — 4pt base</div>
          <div className="spacing-stack">
            {spacing.map(([k,v]) => (
              <div key={k} className="spacing-row">
                <span className="mono tabular" style={{ width: 36, color: 'var(--ink-3)' }}>s-{k}</span>
                <span className="mono tabular" style={{ width: 36, color: 'var(--ink-4)' }}>{v}px</span>
                <span className="spacing-bar" style={{ width: parseInt(v) }} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Radius</div>
          <div className="radius-grid">
            {radii.map(([k,v]) => (
              <div key={k} className="radius-tile">
                <div style={{ width: 60, height: 60, background: 'var(--paper)', boxShadow: 'inset 0 0 0 1px var(--rule)', borderRadius: `var(--r-${k})` }} />
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>r-{k} · {v}px</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Elevation</div>
          <div className="shadow-stack">
            {shadows.map(s => (
              <div key={s} className="shadow-tile" style={{ boxShadow: `var(--${s})` }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DSSection>
  );
}

/* ─────────────── Buttons ─────────────── */
function ButtonGallery() {
  return (
    <DSSection id="buttons" kicker="04 · Buttons" title="Quiet by default. Loud only when something starts or stops.">
      <div className="ds-grid-2">
        <Demo label="Primary · Secondary · Ghost · Destructive">
          <div className="row gap-2">
            <Btn kind="primary">Start recording</Btn>
            <Btn kind="secondary">Open library</Btn>
            <Btn kind="ghost">Cancel</Btn>
            <Btn kind="destructive">Delete</Btn>
          </div>
        </Demo>
        <Demo label="Sizes">
          <div className="row gap-2">
            <Btn kind="primary" size="sm">Small</Btn>
            <Btn kind="primary">Default</Btn>
            <Btn kind="primary" size="lg">Large</Btn>
          </div>
        </Demo>
        <Demo label="With icon · disabled">
          <div className="row gap-2">
            <Btn kind="primary" icon={<span className="dot dot-rec" />}>Record</Btn>
            <Btn kind="secondary" icon="↗">Export</Btn>
            <Btn kind="primary" disabled>Disabled</Btn>
          </div>
        </Demo>
        <Demo label="Icon button row">
          <div className="row gap-1">
            <IconBtn>★</IconBtn>
            <IconBtn>↗</IconBtn>
            <IconBtn>⌘</IconBtn>
            <IconBtn>⋯</IconBtn>
          </div>
        </Demo>
      </div>
    </DSSection>
  );
}

/* ─────────────── Forms ─────────────── */
function FormGallery() {
  const [t1, setT1] = useStateApp2(true);
  const [seg, setSeg] = useStateApp2('ko');
  const [chk, setChk] = useStateApp2(true);
  return (
    <DSSection id="forms" kicker="05 · Form controls" title="Inputs, toggles, and the BYOK key field.">
      <div className="ds-grid-2">
        <Demo label="Text input">
          <Field label="Meeting title" help="Bartleby will use this if you don't supply one.">
            <input className="input" defaultValue="Acme Ventures — Series Seed" />
          </Field>
        </Demo>
        <Demo label="Mono input · token field">
          <Field label="Hotkey to start recording">
            <input className="input input-mono" defaultValue="⌘ ⇧ R" />
          </Field>
        </Demo>
        <Demo label="Textarea" span={2}>
          <Field label="Prompt — what should Bartleby focus on?" helpItalic help="A sentence or two. Bartleby will keep this in mind while listening.">
            <textarea className="textarea" defaultValue={"Highlight any quotes from the customer about price sensitivity, and surface objections we haven't heard before."} />
          </Field>
        </Demo>

        <Demo label="BYOK · key input" span={2}>
          <div className="col gap-3">
            <Field label="Soniox · streaming STT key" helpItalic help="Your key. Stored in macOS Keychain. Bartleby never sees the bytes leave your machine.">
              <KeyInput prefix="sx_" value="••••••••••••••••••••" status="valid" />
            </Field>
            <Field label="OpenRouter · Solar Pro 3 key">
              <KeyInput prefix="or_" value="••••••••••••" status="invalid" />
            </Field>
          </div>
        </Demo>

        <Demo label="Toggle · checkbox">
          <div className="col gap-4">
            <div className="row gap-3">
              <Toggle on={t1} onChange={setT1} />
              <span style={{ fontSize: 13 }}>Auto-translate Korean ↔ English</span>
            </div>
            <div className="row gap-3">
              <Toggle on={false} />
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Send anonymous diagnostics</span>
            </div>
            <div className="row gap-3">
              <Check on={chk} onChange={setChk} />
              <span style={{ fontSize: 13 }}>I have read the BYOK terms</span>
            </div>
          </div>
        </Demo>

        <Demo label="Segmented · select">
          <div className="col gap-3">
            <Segmented value={seg} options={[{value:'ko',label:'Korean'},{value:'en',label:'English'},{value:'auto',label:'Auto'}]} onChange={setSeg} />
            <div className="row gap-2">
              <div className="select">Solar Pro 3</div>
              <div className="select">All sources</div>
            </div>
          </div>
        </Demo>
      </div>
    </DSSection>
  );
}

/* ─────────────── Recording states ─────────────── */
function RecordingStates() {
  return (
    <DSSection id="recording" kicker="06 · Recording state" title="Idle, listening, processing, complete." lede="The single most important indicator in the app. Vermillion ink — the only saturated color Bartleby uses while running.">
      <div className="ds-grid-4">
        <Demo label="Idle">
          <div className="col gap-3" style={{ alignItems: 'center' }}>
            <RecButton recording={false} />
            <Badge>Idle</Badge>
          </div>
        </Demo>
        <Demo label="Listening">
          <div className="col gap-3" style={{ alignItems: 'center' }}>
            <RecButton recording />
            <div className="row gap-2"><Badge kind="rec" dot="rec">Recording</Badge><span className="mono tabular" style={{ fontSize: 12, color: 'var(--rec)' }}>02:14</span></div>
            <Meter rec />
          </div>
        </Demo>
        <Demo label="Processing">
          <div className="col gap-3" style={{ alignItems: 'center' }}>
            <div className="rec-button" style={{ position: 'relative' }}>
              <div className="rec-spinner" />
            </div>
            <Badge dot="warn">Bartleby is preparing…</Badge>
          </div>
        </Demo>
        <Demo label="Complete">
          <div className="col gap-3" style={{ alignItems: 'center' }}>
            <div className="rec-button"><div className="rec-check">✓</div></div>
            <Badge dot="ok">Notes ready</Badge>
          </div>
        </Demo>
      </div>

      <div className="ds-grid-2" style={{ marginTop: 24 }}>
        <Demo label="Status strip — in titlebar">
          <div className="status-strip">
            <Meter rec />
            <span className="mono tabular" style={{ color: 'var(--rec)' }}>28:04</span>
            <span className="hr-vert" />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>SONIOX · streaming</span>
            <span className="hr-vert" />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>SOLAR PRO 3 · summarising</span>
            <span style={{ flex: 1 }} />
            <Btn kind="ghost" size="sm">Pause</Btn>
            <Btn kind="destructive" size="sm">Stop</Btn>
          </div>
        </Demo>
        <Demo label="Audio level meter">
          <div className="row gap-2" style={{ height: 40, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>−24dB</span>
            <div className="audio-bar"><div style={{ width: '62%' }} /></div>
            <span className="mono tabular" style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 36 }}>−12dB</span>
          </div>
        </Demo>
      </div>
    </DSSection>
  );
}

/* ─────────────── Badges & Status ─────────────── */
function BadgeGallery() {
  return (
    <DSSection id="badges" kicker="07 · Badges & status" title="Tags, language pills, status dots.">
      <Demo label="All badges">
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Badge>EN</Badge>
          <Badge>KO</Badge>
          <Badge>EN/KO</Badge>
          <Badge>Pitch</Badge>
          <Badge>Customer</Badge>
          <Badge kind="rec" dot="rec">Recording</Badge>
          <Badge dot="ok">Synced</Badge>
          <Badge dot="warn">Processing</Badge>
          <Badge kind="ink">Bartleby</Badge>
        </div>
      </Demo>
    </DSSection>
  );
}

/* ─────────────── Domain blocks ─────────────── */
function DomainBlocks() {
  return (
    <DSSection id="blocks" kicker="08 · Meeting blocks" title="The page atoms: meeting card, transcript utterance, summary.">
      <div className="col gap-6">
        <Demo label="Meeting card · row">
          <div style={{ background: 'var(--paper)', boxShadow: 'inset 0 0 0 1px var(--rule)', borderRadius: 'var(--r-sm)' }}>
            <div className="mrow" aria-selected="true">
              <div className="when tabular">14:32<small>오늘 · 47:12</small></div>
              <div>
                <div className="title">Acme Ventures — Series Seed pitch</div>
                <div className="preview">"We're going to need to see traction in Korea, but the wedge against Granola is real. Let's talk follow-on…"</div>
                <div className="row gap-2" style={{ marginTop: 8 }}>
                  <Badge>EN/KO</Badge><Badge>Pitch</Badge><Badge dot="ok">3 sections</Badge>
                </div>
              </div>
              <div className="meta">3 sections<br/>12 actions</div>
            </div>
          </div>
        </Demo>

        <Demo label="Transcript · with translation">
          <div style={{ background: 'var(--paper)', padding: 18, borderRadius: 'var(--r-sm)', boxShadow: 'inset 0 0 0 1px var(--rule)' }}>
            <div className="tbl-utt">
              <div className="ts tabular">00:31</div>
              <div>
                <div className="speaker">Yujin (KO)</div>
                <div className="speech kr">한국어 인식이 60%? 그리고 봇이 회의에 들어와서 다들 어색해해요.</div>
                <div className="trans">Korean recognition is maybe 60%. And the bot enters the meeting — everyone gets self-conscious.</div>
              </div>
            </div>
            <div className="tbl-utt">
              <div className="ts tabular">01:02</div>
              <div>
                <div className="speaker">Sihyun (EN)</div>
                <div className="speech">Right. So if Bartleby ran on your machine, no bot, with native-quality Korean — would you switch?</div>
              </div>
            </div>
          </div>
        </Demo>

        <Demo label="Summary block">
          <div className="summary">
            <h4>Themes</h4>
            <ul>
              <li>Yujin spends ~1hr writing up each 30min meeting (largest pain point).</li>
              <li>Otter trialed and rejected — Korean recognition ~60%, bot disrupts client meetings.</li>
              <li>Price-insensitive. "시간이 더 비싸요." (Time is more expensive.)</li>
            </ul>
          </div>
        </Demo>
      </div>
    </DSSection>
  );
}

/* ─────────────── Sidebar pattern ─────────────── */
function SidebarPattern() {
  return (
    <DSSection id="sidebar" kicker="09 · Sidebar · titlebar" title="Window chrome.">
      <Demo label="Bartleby titlebar (paper, not glass)">
        <div className="bt-window" style={{ height: 220 }}>
          <div className="bt-titlebar">
            <div className="bt-tlights"><i style={{background:'#ff5f57'}}/><i style={{background:'#febc2e'}}/><i style={{background:'#28c840'}}/></div>
            <div className="bt-title-block">
              <div className="bt-title mono">bartleby</div>
              <div className="bt-subtitle">142 meetings · 78h 14m</div>
            </div>
            <div style={{ flex: 1 }} />
            <div className="bt-toolbar">
              <div className="select">All sources</div>
              <Btn kind="ghost" size="sm">Import</Btn>
              <Btn kind="primary" size="sm" icon={<span className="dot dot-rec" />}>Record</Btn>
            </div>
          </div>
          <div className="bt-body">
            <div className="bt-sidebar" style={{ padding: '10px 0' }}>
              <div className="sidebar-header">LIBRARY</div>
              <div className="side-item" aria-selected="true"><span className="ico">▤</span><span style={{flex:1}}>All meetings</span><span className="count">142</span></div>
              <div className="side-item"><span className="ico">★</span><span style={{flex:1}}>Starred</span><span className="count">8</span></div>
              <div className="sidebar-header">PROJECTS</div>
              <div className="side-item"><span className="ico">·</span><span style={{flex:1}}>Fundraise</span><span className="count">24</span></div>
              <div className="side-item"><span className="ico">·</span><span style={{flex:1}}>Design partners</span><span className="count">17</span></div>
            </div>
            <div className="bt-content" style={{ padding: 24, color: 'var(--ink-4)' }}>
              <div className="eyebrow">Content area</div>
            </div>
          </div>
        </div>
      </Demo>
    </DSSection>
  );
}

/* ─────────────── Voice / character ─────────────── */
function VoiceLibrary({ intensity }) {
  const high = intensity > 50;
  const max  = intensity > 80;
  return (
    <DSSection id="voice" kicker="10 · Voice · empty · error" title="Bartleby's voice." lede="Polite. Faintly archaic. Quietly ironic. Never an emoji. Never a smile.">
      <div className="ds-grid-2">
        <Demo label="System messages">
          <div className="col gap-3">
            <div className="msg"><span className="badge badge-ink">i</span><span>{high ? 'Bartleby has prepared your notes.' : 'Notes ready.'}</span></div>
            <div className="msg"><span className="badge badge-ink">i</span><span>{high ? 'Bartleby is listening, with your permission.' : 'Recording started.'}</span></div>
            <div className="msg"><span className="badge badge-ink">i</span><span>{high ? 'Bartleby has retired your draft to the archive.' : 'Draft archived.'}</span></div>
          </div>
        </Demo>
        <Demo label="Errors">
          <div className="col gap-3">
            <div className="msg msg-err"><span className="badge badge-rec">!</span><span>{high ? 'Bartleby would prefer not to. (Microphone permission denied.)' : 'Microphone permission denied.'}</span></div>
            <div className="msg msg-err"><span className="badge badge-rec">!</span><span>{high ? 'Bartleby cannot reach Soniox at this hour. He suggests trying again presently.' : 'Soniox unreachable. Try again.'}</span></div>
            <div className="msg msg-err"><span className="badge badge-rec">!</span><span>{high ? 'Your OpenRouter key was refused. Bartleby has set it aside.' : 'OpenRouter key invalid.'}</span></div>
          </div>
        </Demo>

        <Demo label="Empty state — library" span={2}>
          <div className="empty-state">
            <div className="serif-quote" style={{ fontSize: 26, lineHeight: 1.4, color: 'var(--ink)', maxWidth: 520 }}>
              {max ? '"There are, as yet, no meetings to copy."' :
               high ? 'No meetings yet — Bartleby awaits.' :
                      'No meetings yet.'}
            </div>
            <div className="mono" style={{ marginTop: 18, color: 'var(--ink-4)', fontSize: 12, letterSpacing: '0.06em' }}>
              ⌘⇧R · TO BEGIN
            </div>
            <div style={{ marginTop: 24 }}>
              <Btn kind="primary" icon={<span className="dot dot-rec" />}>Start recording</Btn>
            </div>
          </div>
        </Demo>

        <Demo label="Loading — processing transcript" span={2}>
          <div className="loading-state">
            <div className="loading-meter"><span /><span /><span /></div>
            <div className="serif-quote" style={{ fontSize: 18, marginTop: 18 }}>
              {high ? '"Bartleby is preparing your notes."' : 'Preparing notes…'}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 8, letterSpacing: '0.06em' }}>
              SOLAR PRO 3 · 47:12 OF AUDIO · ABOUT 30 SECONDS
            </div>
          </div>
        </Demo>
      </div>
    </DSSection>
  );
}

/* ─────────────── Applied screens ─────────────── */
function AppliedScreens() {
  return (
    <DSSection id="screens" kicker="11 · Applied" title="The system, in situ." lede="Two screens stitched from the components above — a library and an active recording session.">
      <div className="screen-stage">
        <div className="screen-frame-meta">
          <span className="eyebrow">Screen 01</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>Library · idle</span>
        </div>
        <LibraryScreen />
      </div>
      <div className="screen-stage" style={{ marginTop: 36 }}>
        <div className="screen-frame-meta">
          <span className="eyebrow">Screen 02</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>Recording · live transcript + draft summary</span>
        </div>
        <RecordingScreen />
      </div>
    </DSSection>
  );
}

/* ─────────────── App icon ─────────────── */
function AppIcon() {
  return (
    <DSSection id="icon" kicker="12 · App icon" title="A single mono glyph on paper." lede="The icon is a single lowercase 'b' set in JetBrains Mono, debossed into ivory paper. No mascot. No gradient. The corners follow Apple's superellipse.">
      <div className="ds-grid-3">
        <Demo label="Light · 256">
          <div className="app-icon light">
            <span>b</span>
          </div>
        </Demo>
        <Demo label="Dark · 256">
          <div className="app-icon dark">
            <span>b</span>
          </div>
        </Demo>
        <Demo label="Mono · alt">
          <div className="app-icon mono-alt">
            <span>b·</span>
          </div>
        </Demo>
        <Demo label="Sizes">
          <div className="row gap-3" style={{ alignItems: 'flex-end' }}>
            <div className="app-icon light" style={{ width: 96, height: 96, fontSize: 60 }}><span>b</span></div>
            <div className="app-icon light" style={{ width: 64, height: 64, fontSize: 40 }}><span>b</span></div>
            <div className="app-icon light" style={{ width: 40, height: 40, fontSize: 26 }}><span>b</span></div>
            <div className="app-icon light" style={{ width: 24, height: 24, fontSize: 16 }}><span>b</span></div>
          </div>
        </Demo>
        <Demo label="On Dock (mock)" span={2}>
          <div className="dock">
            <div className="dock-tile"><div className="dock-tile-grad" style={{background:'linear-gradient(180deg,#5ac8fa,#0a84ff)'}} /></div>
            <div className="dock-tile"><div className="dock-tile-grad" style={{background:'linear-gradient(180deg,#ff9f0a,#ff453a)'}} /></div>
            <div className="dock-tile dock-tile-bartleby"><span>b</span></div>
            <div className="dock-tile"><div className="dock-tile-grad" style={{background:'linear-gradient(180deg,#34c759,#30b350)'}} /></div>
            <div className="dock-tile"><div className="dock-tile-grad" style={{background:'linear-gradient(180deg,#bf5af2,#7d3ad2)'}} /></div>
          </div>
        </Demo>
      </div>
    </DSSection>
  );
}

/* ─────────────── Marketing ─────────────── */
function Marketing() {
  return (
    <DSSection id="marketing" kicker="13 · Marketing" title="heybartleby.com — components." lede="The website uses the same paper, the same ink, the same mono. No new tokens.">
      <div className="col gap-8">
        <Demo label="Hero — landing">
          <div className="mk-hero">
            <div className="eyebrow">heybartleby.com</div>
            <h2 className="mono" style={{ fontSize: 56, lineHeight: 1.05, margin: '14px 0 0', letterSpacing: '-0.02em', color: 'var(--ink)', fontWeight: 500, textWrap: 'balance' }}>
              Bartleby takes notes.<br/>Then leaves you alone.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--ink-3)', maxWidth: 560, margin: '20px 0 0' }}>
              A meeting scrivener for Mac. Korean-first. Bring your own keys.
              Notes live on your machine, in plain markdown, forever.
            </p>
            <div className="row gap-3" style={{ marginTop: 28 }}>
              <Btn kind="primary" size="lg">Download for Mac</Btn>
              <Btn kind="ghost" size="lg">Read the manifesto</Btn>
            </div>
            <div className="mono" style={{ marginTop: 32, fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
              REQUIRES SONIOX + OPENROUTER KEYS · ~$10/mo TYPICAL
            </div>
          </div>
        </Demo>

        <Demo label="Wedge cards" span={2}>
          <div className="wedge-grid">
            {[
              ['BYOK', 'Your keys. Your data. A third of the cost of Granola.'],
              ['No-bot', 'Bartleby never enters the meeting. He listens from your machine.'],
              ['Korean-first', 'Soniox + Solar Pro 3. SOTA in both directions.'],
              ['Markdown forever', 'Notes are plain files on your Mac. No vendor lock-in.'],
            ].map(([k,v],i) => (
              <div key={k} className="wedge-card">
                <div className="mono tabular" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>0{i+1}</div>
                <div className="mono" style={{ fontSize: 22, color: 'var(--ink)', marginTop: 10, letterSpacing: '-0.01em' }}>{k}</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-3)', margin: '12px 0 0' }}>{v}</p>
              </div>
            ))}
          </div>
        </Demo>

        <Demo label="Pricing — quiet">
          <div className="pricing">
            <div className="pricing-row pricing-head">
              <span className="mono">PLAN</span>
              <span className="mono">BARTLEBY</span>
              <span className="mono">YOUR KEYS</span>
              <span className="mono tabular">TYPICAL</span>
            </div>
            <div className="pricing-row">
              <span>Light · 30 meetings/mo</span>
              <span className="tabular">$5</span>
              <span className="tabular">~$10</span>
              <span className="tabular" style={{ color: 'var(--ink)' }}>$15/mo</span>
            </div>
            <div className="pricing-row">
              <span>Heavy · 110 meetings/mo</span>
              <span className="tabular">$5</span>
              <span className="tabular">~$35</span>
              <span className="tabular" style={{ color: 'var(--ink)' }}>$40/mo</span>
            </div>
            <div className="pricing-row pricing-foot">
              <span className="serif-quote" style={{ fontStyle: 'italic' }}>Compared with Granola</span>
              <span></span><span></span>
              <span className="tabular" style={{ color: 'var(--ink-4)' }}>$14/mo · capped, English-first</span>
            </div>
          </div>
        </Demo>
      </div>
    </DSSection>
  );
}

/* ─────────────── Footer ─────────────── */
function Footer() {
  return (
    <footer className="ds-footer">
      <div className="hr-thick" />
      <div className="row" style={{ padding: '24px 0', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '-0.01em' }}>bartleby · design system v0.1 · 2026-05</div>
        <div className="serif-quote" style={{ fontSize: 14 }}>
          "I would prefer not to take notes."
        </div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--ink-4)' }}>heybartleby.com</div>
      </div>
    </footer>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
