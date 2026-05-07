# WatchOverlay — Floating Caption Window

> 시청 모드 (YouTube · podcast · 컨퍼런스) 의 *영상 위 floating caption window*.
> design-system 의 Recording session 이 아니라 *별개* 의 surface.
> Recording session = full app window. WatchOverlay = always-on-top instrument over someone else's UI.

## Why a separate component

Recording session (`screens.jsx` 의 meeting view) 의 가정:
- Full app window
- Sidebar + transcript grid + summary rail
- 사용자가 *이 창에 집중*

WatchOverlay 의 가정:
- Always-on-top, video player 위
- 사용자는 *영상에 집중*, 자막은 부수적 safety net
- 작은 footprint, low chrome, no sidebar

→ Recording session compact mode 가 아님. 별개 spec.

## Layout

```
┌───────────────────────────────┐ ← 4px hairline drag handle (--rule)
│ ⠿ Bartleby      —  □  ✕      │ ← 8px chrome strip (hover 시만 표시)
├───────────────────────────────┤
│                               │
│   "the model handles long     │ ← FINAL caption (KO, Pretendard 16px,
│   contexts surprisingly       │     ink 100%, weight 500)
│   well..."                    │
│                               │
│   ⏵ "and importantly..."      │ ← PARTIAL (KO, Pretendard 16px,
│                               │     ink-3, italic, animated cursor)
│                               │
└───────────────────────────────┘
   ↘ resize handle (12×12, hover 시만)
```

### Position
- **Default**: bottom-left of primary screen, 32px margin, anchored
- 사용자가 drag 하면 위치 저장 (Settings.overlay.position)
- 영상 fullscreen 진입 시 overlay 자동 follow (NSPanel `fullScreenAuxiliary` collection behavior)

### Size
- **Default**: 480px × 200px
- Min: 320×120 / Max: 800×400
- User-resizable (corner handle, 12×12px hover-visible)
- Width 변경 시 caption 줄바꿈 자동

### Surface (background)
**translucent material**, NOT serial opacity:
- `--paper` 톤 + `backdrop-filter: blur(12px)` (macOS material 효과)
- Light mode: `oklch(98.2% 0.005 85 / 0.85)` + blur
- Dark mode: `oklch(15.5% 0.003 250 / 0.88)` + blur
- *Caption text 자체는 항상 100% opacity* — 가독성 우선
- 사용자가 overall opacity 슬라이더 조절 (Settings 에) → background only

### Chrome (hover-only)
- Drag handle (4px hairline, top edge, `--rule`)
- Title strip 8px (Bartleby 워드마크 좌, 컨트롤 우)
  - Mono "BARTLEBY" 11px tracking-wider
  - Pin/unpin · maximize/restore · close (icon button 12×12, `--ink-4`)
- Hover transition 150ms ease

### Caption typography
**Pretendard sans (NOT Gowun Batang)** — 라이브 자막은 가독성 우선:
- KO final: `--font-body-kr`, 16px, weight 500, `--ink` 100%, line-height 1.4 + `kr-leading`
- KO partial: 동일 size/weight, `--ink-3`, italic, blinking cursor `▌` 끝에
- 짧은 음성 (1-2 word) 도 별도 줄로 — 시간 중심 layout
- 최대 3 lines 동시 표시 (스크롤 X, 새 final 들어오면 이전 final fade out 200ms)

### EN original (toggle)
- Default: hidden (사용자 답변 — 한국어 safety net 만)
- ⌥-hold: 잠시 표시 (하나 위 줄, 12px, `--ink-4`, italic Cormorant)
- Settings 에서 영구 toggle: `caption-mode: ko | ko+en | en`

## States

### state: idle
캡처 시작 전 (overlay 띄우면 첫 화면):
- Caption 영역에: *"Awaiting English audio."* (italic Cormorant, `--ink-3`, 13px)
- chrome 의 record 인디케이터 dot (`--ink-5`)

### state: listening
캡처 중, partial 도 final 도 아직 X:
- Caption 영역에: 작은 audio meter (components.css §RECORDING METER `.meter` 6 bars 재사용)
- chrome 의 dot pulse (`--rec` 색)

### state: captioning (live)
정상 운영. partial + final 흐름.

### state: translating
final 받았는데 Solar Pro 3 응답 대기 중:
- Final 줄 다음에 `▌` cursor 깜빡임 (200ms)
- 5초 timeout 시 EN fallback + "(번역 보류)" badge

### state: reconnecting
STT websocket 끊김:
- chrome 에 작은 warn 아이콘 + "Bartleby would prefer not to say. (재연결 중)"
- Caption 그대로 유지 (마지막 final 까지)
- 백그라운드에서 exponential backoff

### state: drm-blocked
RMS < -60dBFS for 10-20s 연속:
- Caption 영역 dim (background 만 paper-3, caption text X)
- 중앙: italic Cormorant 13px *"Bartleby would prefer not to. (재생 영상이 보호되어 있는 것 같습니다.)"*
- "Dismiss" + "Stop" 버튼 (작게)

### state: permission-denied
Screen Recording 권한 X:
- Caption 영역에: italic Cormorant *"Bartleby cannot listen without permission."*
- "Open Settings" 버튼 → `x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`

### state: complete
세션 종료 후 (overlay 닫기 전 잠시):
- *"Bartleby has prepared your translation."* (italic Cormorant, fade out 1.5s)
- 그리고 overlay close

## Interaction

### Click-through mode
사용자 setting:
- **interactive (default)**: overlay 가 click 받음 (drag/resize/chrome 인터랙션)
- **passthrough**: overlay 가 click 무시 (영상 controls 가 통과 — `setIgnoreCursorEvents(true)`)
- ⌥-click 으로 임시 toggle (단축키)

### Keyboard
- ⎋ (Esc) — overlay focus 시 stop & close
- ⌘W — overlay focus 시 close (캡처 계속)
- ⌥-hold — EN original 표시
- ⌥-click — passthrough toggle

### Accessibility
- VoiceOver label: *"Bartleby watch captions, floating window"*
- 각 caption line 은 ARIA live region (polite)
- 영상 controls focus 가능하도록 passthrough 기본값으로 둘지 검토 (사용자 dogfood)

## Tokens used (design-system 인용)

```css
/* surface */
background: var(--paper)        /* light */ / var(--paper-2) /* alt */
border: 1px solid var(--rule)   /* subtle */
backdrop-filter: blur(12px)
border-radius: var(--r-md)      /* 6px */
box-shadow: var(--shadow-3)     /* tokens.css elevation */

/* chrome */
font-family: var(--font-mono)   /* JetBrains Mono / D2Coding */
font-size: var(--t-xs)          /* 11px */
letter-spacing: var(--tracking-wider)  /* 0.12em */
color: var(--ink-4)             /* tertiary */

/* caption FINAL */
font-family: var(--font-body-kr) /* Pretendard */
font-size: 16px                  /* 사용자 setting 14-18 range */
font-weight: 500
line-height: 1.4
color: var(--ink)
letter-spacing: var(--kr-tracking)

/* caption PARTIAL */
font-style: italic
color: var(--ink-3)

/* caption EN (⌥-hold) */
font-family: var(--font-serif)   /* Cormorant Garamond */
font-style: italic
font-size: var(--t-sm)           /* 12px */
color: var(--ink-4)
```

## Voice copy matrix (Bartleby 캐릭터 일관)

| State | Copy |
|---|---|
| idle | *"Awaiting English audio."* |
| listening (no audio yet) | *"Bartleby is listening. The words will come."* |
| captioning | (no copy — caption 자체가 콘텐츠) |
| translating delay | (no copy — cursor 만) |
| reconnecting | *"Bartleby would prefer not to say. (재연결 중)"* |
| translation timeout | *"(번역 보류)"* + EN fallback |
| drm-blocked | *"Bartleby would prefer not to. (재생 영상이 보호되어 있는 것 같습니다.)"* |
| permission-denied | *"Bartleby cannot listen without permission."* |
| complete | *"Bartleby has prepared your translation."* |
| no watch history (Library) | *"Bartleby has not yet listened in your stead. Put something on."* |

(meeting mode 의 *"Bartleby has prepared your notes."* 와 평행 구조 — only outcome noun 변경.)

## Implementation notes (Tauri)

- Tauri 2.0 의 `WebviewWindow` 만으로는 부족 (`fullScreenAuxiliary` collection behavior 부재)
- `tauri-plugin-nspanel` (community crate) 또는 작은 자체 plugin 필요 — Week 1 spike 에서 검증
- `setAlwaysOnTop(true)` + `setDecorations(false)` + custom drag region (CSS `-webkit-app-region: drag`)
- transparent webview = `macOSPrivateApi: true` (tauri.conf.json) — Mac App Store 제출 시 영향, v1 직접 DMG 라 OK
- 두 개 window (sidebar/main + overlay) 동시 — Tauri 2.0 supported, Phase 0 spike 에서 검증

## Open questions (Phase 0 designer 결정)

- Overlay close 시 Library 의 watch session 자동 저장 여부 (사용자 confirm modal? Or silently 저장)
- Multi-monitor 에서 overlay 위치 기억 (per-display? 또는 last-known)
- Hover-only chrome timing (hover 진입 즉시? 200ms 지연?)
