# Permission Lifecycle UI

> **PARTIAL DEPRECATION 2026-05-11 (Phase 4.5)** — Watch overlay 의 permission lifecycle UX
> 가정 부분은 deprecate. Screen Recording / Mic permission 자체는 Meeting 의
> system audio capture 에 여전히 필요하므로 backend 인프라 보존.
> Watch-mode-specific 분기 (`Watch mode 는 mic 거부돼도 작동`, State C 화면) 는
> 현재 product 에서 의미 없어짐. 현재 product shape 는 VISION.md / PLAN.md 참조.

> Microphone / Screen Recording 권한 요청, 거부, 복구 flow.
> design-system 의 Modal / Toast / Button / EmptyState 패턴 재사용.

## 권한 매트릭스

| Mode | Screen Recording | Microphone |
|---|---|---|
| Watch (시청) | ✅ 필수 | ❌ 불필요 |
| Meeting (미팅) | ✅ 필수 | ✅ 필수 |
| Library / Settings 만 | ❌ | ❌ |

→ **Watch mode 는 mic 거부돼도 작동.** Meeting mode 만 둘 다 필수.

## Lifecycle

```
First use         → Modal: 권한 요청 안내 (캐릭터 톤)
                  → 사용자 [Continue] click
                  → macOS 시스템 권한 다이얼로그
                       ↓
            ┌──────────┴───────────┐
       ✅ Granted             ❌ Denied
            ↓                     ↓
     녹음 시작 가능        Recovery view 표시
                            ↓
                    [Open Settings] [I've granted it]
                            ↓
                    macOS Settings.app 이동
                    또는 recheck_permissions() 호출
                            ↓
                    granted 면 다시 시도
```

## States & screens

### State A: First-time permission ask

세션 시작 (record button) 첫 클릭 시:

```
┌──────────────────────────────────────┐
│                                      │
│   Bartleby would prefer to listen.   │ ← italic Cormorant 18px ink
│                                      │
│   Bartleby needs your permission     │ ← Pretendard 13px ink-3
│   to record system audio (and        │
│   microphone, for meeting mode).     │
│                                      │
│   These are macOS-level permissions  │
│   you grant once. Bartleby never     │
│   sends recordings without your      │
│   action.                            │
│                                      │
│            [Cancel]   [Continue]     │
└──────────────────────────────────────┘
```

[Continue] 클릭 → macOS 시스템 권한 prompt (`AVCaptureDevice.requestAccess` / `CGRequestScreenCaptureAccess`).

### State B: Denied — Recovery view

mic 또는 screen recording 거부 후:

```
┌──────────────────────────────────────┐
│                                      │
│   Bartleby cannot listen.            │ ← italic Cormorant 18px ink
│                                      │
│   The {Microphone / Screen           │ ← Pretendard 13px ink-3
│   Recording} permission was not      │
│   granted. Without it, {Watch /      │
│   Meeting} mode cannot start.        │
│                                      │
│   You can grant it in System         │
│   Settings, then return here.        │
│                                      │
│   [Open Settings]   [I've granted it]│
└──────────────────────────────────────┘
```

[Open Settings] 동작:
- mic: `x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone`
- screen recording: `x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`

[I've granted it] 동작:
- Tauri command `recheck_permissions()` 호출
- granted 면 → SessionSupervisor `Idle` 로 복귀 + 자동 retry 옵션
- 여전히 denied 면 → 같은 view 재표시 + 작은 toast *"Bartleby still cannot listen."*

### State C: Partial denial (Watch mode 만 가능)

Meeting mode 시도했는데 mic 만 거부됨:

```
┌──────────────────────────────────────┐
│   Bartleby has only one ear.         │ ← italic Cormorant 18px
│                                      │
│   Microphone is denied, so meeting   │ ← Pretendard 13px ink-3
│   mode (which captures your voice)   │
│   is unavailable. Watch mode still   │
│   works — Bartleby can listen to     │
│   what your computer plays.          │
│                                      │
│   [Switch to Watch]  [Open Settings] │
└──────────────────────────────────────┘
```

이 경우 mode-switch widget 의 Meeting option 은 `disabled` 상태 (cursor: not-allowed).
Tooltip: *"Bartleby cannot listen without microphone permission."*

### State D: macOS app restart 필요 시 (rare)

ScreenCaptureKit 권한은 *때때로 앱 재시작 필요*. 감지되면:

```
┌──────────────────────────────────────┐
│   Bartleby has been granted          │
│   permission. A restart is needed    │
│   to remember it.                    │
│                                      │
│            [Restart now]             │
└──────────────────────────────────────┘
```

## Tokens used

design-system 의 Modal 패턴 그대로:
```css
modal-overlay: var(--paper) backdrop with backdrop-filter: blur(8px), rgba(0,0,0,0.3) overlay
modal-card:    var(--paper), border-radius: var(--r-lg), box-shadow elevation
header:        var(--font-serif) italic, var(--t-lg) (18px)
body:          var(--font-body), var(--t-base) (13px), var(--ink-3)
buttons:       Btn primary (Continue/Open Settings) + Btn ghost (Cancel/Switch)
```

## Voice copy matrix

| State | Title | Body |
|---|---|---|
| First-time ask | *"Bartleby would prefer to listen."* | "Bartleby needs your permission to record system audio (and microphone, for meeting mode). These are macOS-level permissions you grant once." |
| Mic denied (Meeting) | *"Bartleby cannot listen."* | "The Microphone permission was not granted. Without it, Meeting mode cannot start." |
| Screen denied (Watch) | *"Bartleby cannot listen."* | "The Screen Recording permission was not granted. Without it, Watch mode cannot start." |
| Partial (mic only denied) | *"Bartleby has only one ear."* | "Microphone is denied, so meeting mode is unavailable. Watch mode still works." |
| Recheck still denied | *"Bartleby still cannot listen."* | (toast, 3s auto-dismiss) |
| Restart needed | *"A restart is needed to remember it."* | "Bartleby has been granted permission. A restart is needed to remember it." |
| Settings 안내 button | "Open Settings" | (action) |
| Recheck button | "I've granted it" | (action) |

## Implementation notes (Tauri)

- `recheck_permissions()` Tauri command: `AVCaptureDevice.authorizationStatus(for:.audio)` + `CGPreflightScreenCaptureAccess()` → `{ mic: granted|denied, screen: granted|denied }` 반환
- macOS settings deeplink: `tauri::api::shell::open(_, "x-apple.systempreferences:...")`
- React side: 권한 status 를 zustand/jotai store 에 둠. mode-switch widget 이 구독.
- 첫 번째 권한 prompt 는 mic/screen 한 번에 두 개 띄우지 말고 *순차* — UX 혼란 방지

## Open questions
- 권한 변경을 active 하게 watch 할지 (`NSDistributedNotificationCenter` 의 `com.apple.preference.security` 변경 알림 — 가능 여부 검증)
- "I've granted it" 버튼 누르면 retry 횟수 제한 (3회 이상 fail 시 sticky modal 로 escalate?)
