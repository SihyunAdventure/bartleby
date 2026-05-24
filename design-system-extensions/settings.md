# Settings UI

> **PARTIAL DEPRECATION 2026-05-11 (Phase 4.5)** — Tab 2 (Modes) 의 Watch Mode 섹션
> (overlay opacity / position / caption font size / click-through) 과 Modes 탭 전반의
> Watch / Meeting 이중 분기 가정은 product 재정의로 제거됨.
> Tab 1 Keys, Tab 3 Storage, Tab 4 Shortcuts (⌘⌃M recording), Tab 5 About 은 여전히 유효.
> 현재 product shape 는 VISION.md / PLAN.md 참조.

> 사용자 preferences 화면. Phase 0 의 `/settings` 라우트.
> design-system 의 KeyInput / Toggle / Segmented / Field 재사용. 신규 컴포넌트 없음.

## Layout

Modal-style sheet (full-app overlay, 사이드바 X). 가운데 정렬, 너비 720px.

```
┌──────────────────────────────────────────────────────┐
│ ← Back                                               │
│                                                      │
│   SETTINGS                                           │
│   Bartleby would prefer not to bother you.           │ ← italic Cormorant 13px ink-3
│                                                      │
│   ┌── Tabs (Segmented control) ────────────────┐    │
│   │ Keys │ Modes │ Storage │ Shortcuts │ About │    │
│   └────────────────────────────────────────────┘    │
│                                                      │
│   <selected tab content>                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Tab 5종 (Segmented control 가로):
1. **Keys** — BYOK
2. **Modes** — Watch / Meeting overlay/recording 옵션
3. **Storage** — 저장 위치, retention
4. **Shortcuts** — 단축키 customize
5. **About** — 버전, license, 자동 업데이트

---

## Tab 1: Keys (BYOK)

```
Soniox API Key                    [✓ verified]
Used for STT (transcription).
[●●●●●●●●●●●●●●●●●●●●●●●●●●●●]   [Verify] [Clear]
$0.12/hr 추정 ($0.30/hr legacy 가격, 가입 시 직접 확인)

Upstage API Key                   [✓ verified]
Used for KO translation/final note (solar-pro3 direct API).
[●●●●●●●●●●●●●●●●●●●●●●●●●●●●]   [Verify] [Clear]
~$0.15/$0.60 per 1M tokens

Both keys are stored in macOS Keychain. No OpenRouter/local model is used.
```

- KeyInput component (`components.jsx` `KeyInput`) 그대로 사용
- States: empty / typing / verifying / verified ✓ / invalid ✗ (이미 design-system 의 spec 있음)
- 한국어 helper text 는 italic Cormorant 11px `--ink-4`

---

## Tab 2: Modes

```
WATCH MODE
─────────────────────────────────────────────
Default caption display
( ) KO only             ← default
( ) KO + EN above
( ) EN only
                                              (Segmented)

Overlay opacity              [●━━━━━━━━━━] 85%
Overlay position             [bottom-left ▾]
Caption font size            [14px ▾] [15px] [16px ▾default] [17px] [18px]
Caption pause threshold (s)  [3]              ← N초 무음 후 cursor stop

[ ] Click-through by default (⌥-click toggles)


MEETING MODE
─────────────────────────────────────────────
Microphone source            [Default ▾]
Bilingual stream layout      ( ) KO|EN side-by-side    ← default
                             ( ) KO above EN stack
                             ( ) Single (auto-detect)
Auto-summarize on stop       [ON ▼]
Summary language             [한국어 ▾]
```

---

## Tab 3: Storage

```
Save notes to                     [~/Documents/Bartleby/]   [Choose...]
Audio retention                    [●━━━━━━━━] 30 days
                                   (transcript 영구 보유)

Disk usage                         342 MB  (124 sessions, 28 hours audio)
[Open in Finder]   [Clean up old audio]
```

---

## Tab 4: Shortcuts

표 형태. 사용자 customize 가능 (codex Q4 답 — ⌘⌃ default 로 변경, customize OK).

```
Toggle Watch mode overlay         ⌘ ⌃ B          [Customize...]
Toggle Meeting recording          ⌘ ⌃ M          [Customize...]
Show Bartleby panel               ⌘ ⇧ V          [Customize...]
Capture audio screenshot          ⌘ ⇧ 4          [Customize...]
Quit                              ⌘ Q            (system)
```

(default 가 `⌘⌃B`/`⌘⌃M` 으로 변경됨 — codex 가 Chromium bookmark bar 충돌 경고. ⌘⇧B 는 브라우저에서 bookmark bar toggle.)

---

## Tab 5: About

```
Bartleby v0.1.0
"I would prefer not to listen in English."

heybartleby.com  ·  github.com/heybartleby/bartleby

Auto-update                       [Check now]
Last checked: 2026-05-14 14:32
Update channel                    ( ) stable    ( ) beta

License: MIT (or source-available — TBD Phase 5)

Design with care from Seoul.
```

italic Cormorant 13px 일부, mono 11px 메타데이터.

---

## Voice copy matrix

| Surface | Copy |
|---|---|
| Settings header | *"Bartleby would prefer not to bother you."* (italic Cormorant 13px ink-3) |
| Verify success | *"Verified."* (small ✓ + green-ok hint) |
| Verify fail | *"Bartleby would prefer not to. (key 가 거부되었습니다.)"* |
| Clean-up confirm | *"Bartleby will forget 23 audio files older than 30 days. This cannot be undone."* |
| About tagline | *"I would prefer not to listen in English."* |

---

## Tokens used

design-system 의 토큰 그대로:
- `var(--paper)` background, `var(--paper-2)` tab inactive
- `var(--rule)` border, `var(--rule-strong)` selected
- `var(--ink)`, `var(--ink-2)`, `var(--ink-3)`, `var(--ink-4)`
- Type: `var(--t-base)` body, `var(--t-md)` headers, `var(--t-xs)` mono labels
- Spacing: `var(--s-3)` ~ `var(--s-6)` row gaps, `var(--s-8)` section gaps

## Open questions (Phase 0 designer 결정)

- Settings 가 modal 인지 라우트 (`/settings`) 인지 — 현재 spec 은 라우트 가정 (Tab Segmented 가 sidebar 보다 자연)
- Tab 전환 animation (cross-fade 100ms vs none)
- BYOK key verify 호출 시 어떤 endpoint 사용 (Soniox: WebSocket config ping, Upstage: minimal chat completion ping)
- Theme (light/dark) toggle 위치 — Settings 탭? 또는 menu bar?
