# Mode Switch Widget

> **DEPRECATED 2026-05-11 (Phase 4.5)** — Watch overlay / mode toggle 분기 자체가
> Bartleby 의 product 재정의로 제거됨. 이 문서는 historical reference 로만 보관.
> 현재 product shape 는 VISION.md / PLAN.md 참조.

> Sidebar 상단의 Watch / Meeting 모드 전환 widget.
> design-system 의 Segmented control (`components.css §SEGMENTED CONTROL`) 재사용.

## Layout

Sidebar 의 Bartleby 워드마크 *바로 아래*, 검색 input 위.

```
┌─────────────────────────────┐
│ Bartleby                    │ ← Brand 워드마크 (mono, --t-md, tracking-wider)
│                             │
│ ┌─── ◐ Watch │ ◑ Meeting ┐ │ ← Segmented control (60% width, centered)
│ └─────────────┴───────────┘ │
│                             │
│ 🔍 Search...                │ ← 검색 input
│                             │
│ ── Today ────────────────── │ ← Library nav groups
│ ...                         │
└─────────────────────────────┘
```

## Sizing & spacing
- Width: sidebar 240px - var(--s-6) padding × 2 = 192px
- Height: 32px (Segmented `.size-md` 정도)
- Margin-top: var(--s-3) (브랜드 아래 12px)
- Margin-bottom: var(--s-4) (검색 위 16px)

## States

### Default (idle)
- Active option: `--paper` background + `--ink` text + `--rule-strong` 1px border
- Inactive option: transparent + `--ink-3` text
- Icon (12×12, lucide): `circle-half` 또는 `play-circle` (Watch) / `mic` (Meeting)

### Hover (inactive option)
- `--paper-3` background (subtle)
- 100ms ease-out

### Active session (recording 중) — 중요
모드 전환 *위험* 상태. 활성 세션이 있는 모드 시각화:
- Active option 의 좌측 dot (4×4, `--rec` 색, pulse animation `meter` 1.1s)
- Other option 클릭 시 → confirm modal 발화 (아래)
- 세션 자체는 stop 버튼/단축키로만 종료 (mode toggle 로 silent X)

### Disabled (permission needed)
- Permission 거부된 모드 → `--ink-5` text + `not-allowed` cursor
- Tooltip: *"Bartleby cannot listen without {permission}."* + 클릭 시 Settings deeplink

## Transition (mode 전환 시)

Active session 없으면 즉시 전환. Animation:
- Sidebar 의 Library nav groups 가 cross-fade 200ms ease-out (Today / Yesterday / This Week 의 항목들이 mode filter 됨)
- Main content area route transition 200ms (`/live/watch` ↔ `/live/meeting` 또는 Library 의 watch/meeting filter 변경)
- 너무 빠른 토글 (300ms 이내 연속) 은 throttle (UI thrashing 방지)

## Active session confirm modal

```
┌──────────────────────────────────────┐
│ Bartleby is currently listening.      │ ← italic Cormorant 15px ink
│                                       │
│ Switching modes will stop the         │ ← body Pretendard 13px ink-3
│ current {watch/meeting} session.      │
│                                       │
│              [Cancel]  [Stop & Switch]│
└──────────────────────────────────────┘
```

- Modal: design-system `components.css §MODAL` 재사용
- Cancel = 모드 전환 취소, 세션 계속
- Stop & Switch = SessionSupervisor `stop_recording()` async → `Saving` → 새 모드로 navigate
- 단축키 (⌘⌃B/⌘⌃M) 로 활성 세션 중 전환 시도해도 같은 modal

## Routing

| Mode | URL | View |
|---|---|---|
| Watch (live) | `/live/watch` | overlay window 띄우는 trigger view + capture status |
| Meeting (live) | `/live/meeting` | KO\|EN split panel + LIVE indicator |
| Watch (idle, library) | `/` (filter: type=watch) | Library + watch session 만 |
| Meeting (idle, library) | `/` (filter: type=meeting) | Library + meeting session 만 |
| Both (Library 전체) | `/` (filter: all) | All sessions, type 칩 toggle |

Library 의 type filter 와 mode-switch 가 *coupled*: mode toggle 시 Library 도 자동 filter.

## Tokens used

```css
.mode-switch {
  margin-top: var(--s-3);
  margin-bottom: var(--s-4);
  width: calc(100% - var(--s-3) * 2);
}
.mode-switch [role="tab"] {
  font-family: var(--font-display);  /* JetBrains Mono */
  font-size: var(--t-xs);            /* 11px */
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}
.mode-switch [role="tab"][aria-selected="true"] {
  background: var(--paper);
  color: var(--ink);
  border: 1px solid var(--rule-strong);
}
.mode-switch [role="tab"]:not([aria-selected="true"]) {
  color: var(--ink-3);
}
.mode-switch .active-dot {
  width: 4px; height: 4px;
  background: var(--rec);
  border-radius: var(--r-full);
  animation: meter 1.1s ease-in-out infinite;  /* tokens: meter keyframe */
}
```

## Voice copy

| Surface | Copy |
|---|---|
| Confirm modal title | *"Bartleby is currently listening."* |
| Confirm modal body | "Switching modes will stop the current watch/meeting session." |
| Cancel button | "Cancel" |
| Confirm button | "Stop & Switch" |
| Disabled tooltip | *"Bartleby cannot listen without permission."* |

## Open questions
- 모드 전환 시 confirm modal 을 *항상* 띄울지, 또는 Settings 의 "Switch silently" 옵션 둘지 (사용자 dogfood 후 결정)
- Library 의 type filter UI: type 칩 (Buttons 패턴) vs 별도 sidebar nav vs 양쪽 모두 (UX 검증 필요)
