/* global React */
const { useState, useEffect, useRef } = React;

/* ───────────────────────────────────────────────────────────────
   Bartleby — JSX wrappers around components.css
   These are presentational — they render the styled markup the
   design-system page and the applied app screens both share.
   ─────────────────────────────────────────────────────────────── */

function Btn({ kind = 'secondary', size, children, icon, onClick, disabled }) {
  return (
    <button
      className={`btn btn-${kind} ${size ? 'btn-' + size : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="row" style={{ width: 14, height: 14, justifyContent: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

function IconBtn({ children, onClick }) {
  return <button className="btn btn-icon" onClick={onClick}>{children}</button>;
}

function Toggle({ on, onChange }) {
  return <div className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange?.(!on)} />;
}

function Check({ on, onChange }) {
  return <div className={`checkbox ${on ? 'on' : ''}`} role="checkbox" aria-checked={on} onClick={() => onChange?.(!on)} />;
}

function Badge({ kind = 'default', dot, children }) {
  const cls = kind === 'default' ? 'badge' : `badge badge-${kind}`;
  return (
    <span className={cls}>
      {dot && <span className={`dot dot-${dot}`} />}
      {children}
    </span>
  );
}

function Meter({ rec }) {
  return (
    <span className={`meter ${rec ? 'rec' : ''}`} aria-hidden="true">
      <i /><i /><i /><i /><i /><i />
    </span>
  );
}

function RecButton({ recording, onClick }) {
  return (
    <button className={`rec-button ${recording ? 'recording' : ''}`} onClick={onClick} aria-label={recording ? 'Stop recording' : 'Start recording'}>
      <span className="rec-button-inner" />
    </button>
  );
}

/* ─── Field ─── */
function Field({ label, help, helpItalic, children }) {
  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      {children}
      {help && <div className={`field-help ${helpItalic ? 'italic' : ''}`}>{help}</div>}
    </div>
  );
}

function KeyInput({ prefix, value, status, placeholder = '••••••••••••••••••••••••' }) {
  return (
    <div className="key-input">
      <div className="key-input-prefix">{prefix}</div>
      <input value={value || ''} readOnly placeholder={placeholder} />
      {status && (
        <div className="key-input-status">
          <span className={`dot dot-${status === 'valid' ? 'ok' : status === 'invalid' ? 'rec' : ''}`} />
          {status === 'valid' ? 'Verified' : status === 'invalid' ? 'Invalid' : 'Untested'}
        </div>
      )}
    </div>
  );
}

/* ─── Segmented ─── */
function Segmented({ value, options, onChange }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((opt) => {
        const v = typeof opt === 'string' ? opt : opt.value;
        const l = typeof opt === 'string' ? opt : opt.label;
        return (
          <button key={v} aria-selected={value === v} onClick={() => onChange?.(v)}>{l}</button>
        );
      })}
    </div>
  );
}

/* ─── Swatch ─── */
function Swatch({ name, varName, color }) {
  return (
    <div className="swatch">
      <div className="swatch-tile" style={{ background: color || `var(${varName})` }} />
      <div className="swatch-meta"><b>{name}</b><span>{varName.replace('--','')}</span></div>
    </div>
  );
}

/* ─── Section header ─── */
function DSSection({ id, kicker, title, lede, children }) {
  return (
    <section id={id} className="ds-section">
      <header className="ds-section-h">
        <div className="eyebrow">{kicker}</div>
        <h2 className="ds-section-title">{title}</h2>
        {lede && <p className="ds-section-lede">{lede}</p>}
      </header>
      <div className="ds-section-body">{children}</div>
    </section>
  );
}

function Demo({ label, children, span }) {
  return (
    <div className={`demo ${span ? 'demo-span-' + span : ''}`}>
      <div className="demo-label eyebrow">{label}</div>
      <div className="demo-stage">{children}</div>
    </div>
  );
}

/* ─── Voice card (Bartleby personality) ─── */
function VoiceCard({ quote, attr }) {
  return (
    <div className="voice-card">
      <div className="quote">{quote}</div>
      {attr && <div className="quote-attr">— {attr}</div>}
    </div>
  );
}

/* expose */
Object.assign(window, {
  Btn, IconBtn, Toggle, Check, Badge, Meter, RecButton,
  Field, KeyInput, Segmented, Swatch,
  DSSection, Demo, VoiceCard,
});
