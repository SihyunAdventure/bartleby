/* global React, MacWindow, MacSidebar, MacSidebarItem, MacToolbar */
const { useState: useStateApp } = React;

/* ───────────────────────────────────────────────────────────────
   Bartleby — Applied app screens
   1. Library (meeting list + sidebar) at idle
   2. Active recording with live transcript + draft summary
   ─────────────────────────────────────────────────────────────── */

/* Window chrome — Bartleby's own, not the macos-window starter
   (we want non-glass, paper-aesthetic chrome) */
function BTWindow({ title, subtitle, sidebar, toolbar, children, height = 560 }) {
  return (
    <div className="bt-window" style={{ height }}>
      <div className="bt-titlebar">
        <div className="bt-tlights"><i style={{background:'#ff5f57'}}/><i style={{background:'#febc2e'}}/><i style={{background:'#28c840'}}/></div>
        <div className="bt-title-block">
          <div className="bt-title mono">{title}</div>
          {subtitle && <div className="bt-subtitle">{subtitle}</div>}
        </div>
        <div style={{ flex: 1 }} />
        <div className="bt-toolbar">{toolbar}</div>
      </div>
      <div className="bt-body">
        {sidebar && <div className="bt-sidebar">{sidebar}</div>}
        <div className="bt-content">{children}</div>
      </div>
    </div>
  );
}

const SIDEBAR_NAV = [
  { group: 'LIBRARY', items: [
    { key: 'all',     label: 'All meetings', count: 142, sel: true },
    { key: 'today',   label: 'Today', count: 3 },
    { key: 'week',    label: 'This week', count: 11 },
    { key: 'starred', label: 'Starred', count: 8 },
  ]},
  { group: 'PROJECTS', items: [
    { key: 'fundraise', label: 'Fundraise — seed', count: 24 },
    { key: 'design',    label: 'Design partners', count: 17 },
    { key: 'hiring',    label: 'Hiring', count: 6 },
    { key: 'ops',       label: 'Operations', count: 12 },
  ]},
];

function BTSidebar({ active = 'all' }) {
  return (
    <>
      <div style={{ padding: '12px 18px 8px' }}>
        <div className="mono" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ink)' }}>Bartleby</div>
        <div className="eyebrow" style={{ marginTop: 4 }}>Scrivener · v0.4</div>
      </div>
      {SIDEBAR_NAV.map((g) => (
        <div key={g.group}>
          <div className="sidebar-header">{g.group}</div>
          {g.items.map((it) => (
            <div key={it.key} className="side-item" aria-selected={it.sel || active === it.key}>
              <span className="ico"><BTIcon name={it.key} /></span>
              <span style={{ flex: 1 }}>{it.label}</span>
              <span className="count tabular">{it.count}</span>
            </div>
          ))}
        </div>
      ))}
      <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid var(--rule)' }}>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <span className="dot dot-ok" />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>Keys verified</span>
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 6, letterSpacing: '0.04em' }}>
          SONIOX · OPENROUTER
        </div>
      </div>
    </>
  );
}

function BTIcon({ name }) {
  // tiny mono-line glyphs only — no figurative art
  const stroke = "currentColor";
  const props = { width: 12, height: 12, viewBox: "0 0 12 12", fill: "none", stroke, strokeWidth: 1.2, strokeLinecap: "round" };
  switch (name) {
    case 'all':       return <svg {...props}><path d="M2 3h8M2 6h8M2 9h8"/></svg>;
    case 'today':     return <svg {...props}><circle cx="6" cy="6" r="3.5"/><path d="M6 6V4"/></svg>;
    case 'week':      return <svg {...props}><rect x="2" y="3" width="8" height="7"/><path d="M2 5h8M5 3v0"/></svg>;
    case 'starred':   return <svg {...props}><path d="M6 2l1.2 2.6L10 5l-2 1.8.5 2.7L6 8.2 3.5 9.5 4 6.8 2 5l2.8-.4z"/></svg>;
    default:          return <svg {...props}><rect x="2.5" y="2.5" width="7" height="7"/></svg>;
  }
}

/* ─── Library screen ─── */
const MEETINGS = [
  { date: '오늘',  time: '14:32', dur: '47:12', title: 'Acme Ventures — Series Seed pitch', preview: '"We\'re going to need to see traction in Korea, but the wedge against Granola is real. Let\'s talk follow-on…"', tags: ['EN/KO', 'Pitch'], state: 'done', sel: true },
  { date: '오늘',  time: '11:00', dur: '28:04', title: '디자인 파트너 인터뷰 — Yujin Park (PM, Naver)', preview: '"보통은 회의 끝나고 한 시간씩 정리해요. 그게 제일 싫어요…"', tags: ['KO'], state: 'rec' },
  { date: '오늘',  time: '09:15', dur: '12:48', title: 'Standup — Eng', preview: 'Three blockers; Soniox latency under 400ms confirmed; ship branch by Friday.', tags: ['EN'], state: 'done' },
  { date: '어제',  time: '17:42', dur: '54:21', title: 'Customer call — Hyojin Lee (Toss)', preview: '"한↔영 미팅이 주당 4-5건. 지금은 Otter 쓰는데 한국어가 너무 망가져요."', tags: ['KO'], state: 'done' },
  { date: '어제',  time: '13:00', dur: '38:55', title: '1:1 with Minho — design system audit', preview: 'Decided to go monochromatic. Mono-display + sans-body. Drop the gradient backgrounds.', tags: ['KO'], state: 'done' },
  { date: 'Mon',   time: '15:30', dur: '01:02:11', title: 'Soniox integration review', preview: 'WebSocket reconnection logic, partial-result merging, Korean tokenization edge cases…', tags: ['EN'], state: 'done' },
];

function LibraryScreen() {
  return (
    <BTWindow
      title="bartleby"
      subtitle="142 meetings · 78h 14m"
      sidebar={<BTSidebar />}
      toolbar={
        <>
          <div className="select" style={{ marginRight: 8 }}>All sources</div>
          <Btn kind="ghost" size="sm">Import</Btn>
          <Btn kind="primary" size="sm" icon={<span className="dot dot-rec" />}>Record</Btn>
        </>
      }
      height={580}
    >
      <div style={{ padding: '0 4px' }}>
        <div style={{ padding: '18px 24px 12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 className="mono" style={{ margin: 0, fontSize: 22, letterSpacing: '-0.01em', color: 'var(--ink)', fontWeight: 500 }}>
            All meetings
          </h1>
          <div className="eyebrow tabular">142 ENTRIES · 78h 14m</div>
        </div>
        <div className="hr" />
        <div className="mlist">
          {MEETINGS.map((m, i) => (
            <div key={i} className="mrow" aria-selected={m.sel}>
              <div className="when tabular">
                {m.time}
                <small>{m.date} · {m.dur}</small>
              </div>
              <div>
                <div className="title">{m.title}</div>
                <div className="preview">{m.preview}</div>
                <div className="row gap-2" style={{ marginTop: 8 }}>
                  {m.state === 'rec' && <Badge kind="rec" dot="rec">Recording</Badge>}
                  {m.tags.map(t => <Badge key={t}>{t}</Badge>)}
                </div>
              </div>
              <div className="meta">
                {m.state === 'done' && <>3 sections<br/>12 actions</>}
                {m.state === 'rec' && <span style={{ color: 'var(--rec)' }}>● live</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BTWindow>
  );
}

/* ─── Recording / detail screen ─── */
const TRANSCRIPT = [
  { ts: '00:14', sp: 'Yujin (KO)', kr: true, text: '보통 회의 끝나고 한 시간씩 정리하거든요. 그게 제일 싫어요. 회의는 30분인데 정리가 한 시간.', en: 'I usually spend an hour writing things up after each meeting. The meeting is 30 minutes; the writeup is an hour.' },
  { ts: '00:31', sp: 'Sihyun (KO)', kr: true, text: '그래서 Otter 같은 거 쓰셨다고 했는데, 어떤 부분이 안 맞으셨어요?', en: 'You mentioned trying Otter — what specifically didn\'t work?' },
  { ts: '00:38', sp: 'Yujin (KO)', kr: true, text: '한국어 인식이 60%? 그리고 봇이 회의에 들어와서 다들 어색해해요. 클라이언트 미팅에서는 못 써요.', en: 'Korean recognition is maybe 60%. And the bot enters the meeting — everyone gets self-conscious. Can\'t use it in client meetings.' },
  { ts: '01:02', sp: 'Sihyun (EN)', text: 'Right. So if Bartleby ran on your machine, no bot, with native-quality Korean — would you switch immediately, or is there a migration concern?' },
  { ts: '01:14', sp: 'Yujin (KO)', kr: true, text: '바로요. 진짜로요. 가격은 상관없어요. 시간이 더 비싸요.', en: 'Immediately. Seriously. Price doesn\'t matter — my time is more expensive.', highlight: true },
];

function RecordingScreen() {
  return (
    <BTWindow
      title="bartleby — recording"
      subtitle="디자인 파트너 인터뷰 · Yujin Park"
      sidebar={<BTSidebar active="today" />}
      toolbar={
        <>
          <div className="row gap-2" style={{ marginRight: 12 }}>
            <Meter rec />
            <span className="mono tabular" style={{ fontSize: 12, color: 'var(--rec)' }}>28:04</span>
          </div>
          <Btn kind="secondary" size="sm">Pause</Btn>
          <Btn kind="destructive" size="sm">Stop</Btn>
        </>
      }
      height={580}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', height: '100%' }}>
        {/* Transcript column */}
        <div style={{ padding: '20px 28px', overflow: 'auto', borderRight: '1px solid var(--rule)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="eyebrow">Transcript · Live</div>
            <div className="row gap-2">
              <Segmented value="both" options={[
                { value: 'ko', label: 'KO' },
                { value: 'en', label: 'EN' },
                { value: 'both', label: 'Both' },
              ]} />
            </div>
          </div>

          {TRANSCRIPT.map((u, i) => (
            <div key={i} className="tbl-utt">
              <div className="ts tabular">{u.ts}</div>
              <div>
                <div className="speaker">{u.sp}</div>
                <div className={`speech ${u.kr ? 'kr' : ''}`} style={u.highlight ? { background: 'var(--accent-soft)', padding: '0 2px', borderRadius: 2 } : null}>
                  {u.text}
                </div>
                {u.en && u.kr && <div className="trans">{u.en}</div>}
              </div>
            </div>
          ))}

          {/* live partial */}
          <div className="tbl-utt" style={{ opacity: 0.55 }}>
            <div className="ts tabular">01:28</div>
            <div>
              <div className="speaker">Sihyun (KO)</div>
              <div className="speech kr">
                그럼 가장 큰 unmet need 이…<span className="mono" style={{ marginLeft: 6, color: 'var(--ink-5)' }}>▍</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side: live summary draft */}
        <div style={{ padding: '20px 24px', overflow: 'auto', background: 'var(--paper-2)' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Bartleby is preparing</div>

          <div className="summary" style={{ marginBottom: 16 }}>
            <h4>Working title</h4>
            <div className="mono" style={{ fontSize: 14, color: 'var(--ink)' }}>
              Yujin Park — Korean PM pain points
            </div>
          </div>

          <div className="summary" style={{ marginBottom: 16 }}>
            <h4>Themes (so far)</h4>
            <ul>
              <li>한 시간씩 걸리는 미팅 정리가 가장 큰 불편</li>
              <li>Otter — 한국어 인식 ~60%, 봇 들어가는 게 어색</li>
              <li>가격보다 시간이 더 비싸다 (price-insensitive)</li>
            </ul>
          </div>

          <div className="summary" style={{ marginBottom: 16, borderLeftColor: 'var(--rec)' }}>
            <h4 style={{ color: 'var(--rec)' }}>Quote · candidate</h4>
            <div className="serif-quote" style={{ fontSize: 15, lineHeight: 1.55 }}>
              "바로요. 진짜로요. 가격은 상관없어요. 시간이 더 비싸요."
            </div>
          </div>

          <div className="row gap-2" style={{ marginTop: 8, color: 'var(--ink-4)' }}>
            <span className="dot dot-ok" />
            <span className="mono" style={{ fontSize: 11 }}>Solar Pro 3 · re-summarising every 30s</span>
          </div>
        </div>
      </div>
    </BTWindow>
  );
}

Object.assign(window, { LibraryScreen, RecordingScreen, BTWindow, BTSidebar });
