# Bartleby — v1 Execution Plan

- 시작: 2026-05-07
- 타겟 출시: **2026-08-13 ~ 2026-08-27** (12-14주, 원래 8주에서 연장)
- Solo dev: 김시현
- v1 acceptance: HN / PH launch + waitlist 100+

---

## §0 핸드오프 — autoplan 결정사항 (2026-05-07)

autoplan 3 phase (CEO + Design + Eng) dual voice review 결과 반영.
Phase 1 (CEO): 6/9 critical 발견 → wedge 재정렬.
Phase 2 (Design): 9/11 confirmed → design-system-extensions/ 폴더 생성.
Phase 3 (Eng): 13/14 confirmed → architecture spec 강화.

핵심 변경:

### Wedge 재정렬
- ❌ 기존: "Granola for Korean" (미팅 노트 only) — 12개월 moat 0
- ✅ 신: **"Korean ears for English audio"** (콘텐츠 + 미팅 dual mode)
- 차별화: 시청 모드 floating overlay 는 Granola/Otter/Anarlog 모두 안 가는 카테고리

### Timeline & sequencing
- 8주 → **12-14주** (Phase 1 audio capture 단독 3-5주 현실)
- **Week 1 = capture spike 우선** (UI 보다 capture 검증 먼저, sequence swap)
- Phase 0 (UI shell) 은 spike 결과 confirm 후 Week 2 시작

### Scope 변경
- ➕ 시청 모드 (YouTube 등 system audio 캡처 + floating overlay + 라이브 자막)
- ➕ 모드 전환 UI (시청 / 미팅)
- ➖ Mac App Store v1 cut (직접 DMG notarize 만)
- ➖ Phase 4 search / library 일부 v1.5 로 미룸 (slip buffer)
- ➕ Customer interview 5명 Week 1 (사용자 시간 잡으면)
- ➕ Distribution 전략 (한국 indie community 30%+ pre-launch effort)

### Stack
- Tauri 2.0 유지 (사용자 결정 + 디자인 시스템 React 자산)
- 단 Week 1 spike 결과로 contingency: spike 실패 시 Tauri UI + Swift sidecar 또는 native SwiftUI pivot

### Pricing copy fix
- "BYOK = 1/3 비용" 거짓 (실제 사용자 총 $8-25/mo, Granola $14/mo) — copy 수정
- 새 메시지: "BYOK = control/compliance, vendor 자유"

### v1 컷 (v1.5+ 로 미룸)
- TTS 팟캐스트 재생성
- yt-dlp 자막 추출 alternative
- Follow-up email schema (미팅 모드)
- Mac App Store 배포

### Phase 2 (Design) 추가 결정 (autoplan 2026-05-07)
- ➕ `design-system-extensions/` 폴더 생성 — overlay.md (WatchOverlay spec) + settings.md (Settings UI spec)
- ➕ PRINCIPLES.md §4.2.1 Korean typography exception — **live = Pretendard, static = Gowun Batang**
- ➕ 14 → **19 섹션 매핑 표** (NEXT.md Step 5b) — +5 rows: Floating overlay / Mode switch / Settings / Onboarding / Permission-DRM
- ✅ Watch caption default: KO only (Pretendard 14-16px). EN ⌥-hold toggle
- ✅ 모드 전환: Sidebar 상단 Segmented control + 200ms cross-fade + active session confirm modal
- ✅ Watch mode voice copy matrix (idle/listening/captioning/translating/reconnecting/drm-blocked/permission-denied/complete) → overlay.md
- ✅ Marketing hero reframe: split (YouTube + overlay), meeting secondary

### Phase 3 (Eng) 추가 결정 (autoplan 2026-05-07)
- ➕ Week 1 spike scope 확장 — *signed Tauri bundle + 두 window + NSPanel-equivalent + 1h stable + RSS profile + macOS 15 검증*
- ➕ macOS minimum: 14 → **15 Sequoia** (mic capture 호환성)
- ➕ Storage: 폴더 구조 `sessions/{uuid}/{note.md, audio.opus, transcript.jsonl, events.jsonl}` + `bartleby://{uuid}` 내부 URI
- ➕ STT protocol: monotonic seq# + audio-clock timestamp + 30s ring buffer reconnect + bounded queue 8 + order-preserving translation
- ➕ SessionSupervisor 12-state machine (Rust 단일 owner, React 는 Tauri events 구독)
- ➕ Audio router: 한 SCStream callback → 3 streams (Opus/STT/RMS), peak RSS < 50MB
- ➕ DRM detection heuristic: 8-20s RMS < -60dBFS + DRM app bundle ID hint
- ➕ Permission lifecycle: Settings.app deeplink + 모드별 graceful (Watch 모드는 mic 거부 OK)
- ➕ Sparkle 제거 → **Tauri Updater plugin** (minisign + GitHub Pages JSON)
- ➕ Test minimum: audio fixture corpus + state-machine proptest + Soniox WAV replay + storage roundtrip + Friday 1h dogfood-log

### Q1~Q4 사용자 결정 (autoplan final gate)
- Q1: macOS 15 raise ✅
- Q2: 임시 spec 본인이 (Claude code) draft, 기존 design-system 토큰/voice 인용 ✅
- Q3: Settings 임시 spec 본인이 draft ✅
- Q4: 단축키 default `⌘⌃B` (Watch) / `⌘⌃M` (Meeting), Settings 에서 customize ✅
- Q5: 핵심 6개 + design-system-extensions 만 이 세션 (D2/D3/D5/D6/E5/E6/E7/E8/E9/E10/E11 미완) ✅

자세한 critical 발견 + decision rationale 은 이번 세션 transcript 참조.

---

## §1 v1 스코프 — Korean ears for English audio (Mac only)

### 두 모드 (공통 stack: ScreenCaptureKit + Soniox + Solar Pro 3)

| Mode | 캡처 source | UI | 출력 |
|---|---|---|---|
| **시청 모드** (YouTube/podcast/컨퍼런스) | system audio only | Floating overlay window (영상 위) | 실시간 KO 자막 + 종료 후 노트 옵션 |
| **미팅 모드** | mic + system audio | Sidebar 노트 view | 실시간 KO/EN transcript + 종료 후 한국어 요약 |

**모드 전환**: Sidebar 상단 Segmented control (Watch / Meeting) + 단축키 ⌘⌃B (시청) / ⌘⌃M (미팅). 활성 세션 도중 전환 시 confirm modal.

> 단축키 default 는 `⌘⌃B` / `⌘⌃M` — codex 권고로 `⌘⇧B`/`⌘⇧M` 회피 (Chromium bookmark bar 충돌). Settings 에서 customize 가능.

**캡션 default (시청 모드)**: KO only (Pretendard 14-16px). EN 은 ⌥-hold 또는 Settings 에서 toggle (KO only / KO+EN / EN only).

### v1 에 들어감

**공통**:
- ScreenCaptureKit 시스템 audio 캡처 (mic 옵션)
- Soniox EN/KO STT 스트리밍
- Solar Pro 3 한국어 번역
- 로컬 markdown 저장 (`~/Documents/Bartleby/`)
- 사용자 BYOK 설정 (Soniox + OpenRouter 키 입력)
- Library view (모든 미팅 + 시청 노트 list)
- Settings (모델 / 저장 위치 / 단축키)

**시청 모드 specific**:
- Floating overlay window (영상 위 표시, drag·resize, opacity)
- 실시간 KO 자막 (partial=흐림, final=lock)
- 영상 끝나면 자막 누적 + 한국어 요약 옵션
- DRM 영상 (Netflix 등) 캡처 차단 안내 메시지

**미팅 모드 specific**:
- KO|EN 좌우 split panel (transcript)
- 종료 후 markdown summary (TL;DR + Decisions + Action Items + Quotes)
- LIVE indicator (pulsing dot + timer)

### v1 컷 (Non-goals 자세한 list 는 VISION.md)

- TTS 팟캐스트 재생성 (v1.5+)
- yt-dlp 자막 추출 alternative (v1.5+)
- Follow-up email schema (v1.5+)
- Mac App Store 배포 (v1.5+, sandbox 검증)
- 모바일 / 클라우드 sync / 팀 / 자동 미팅 감지 (v2.0)

---

## §2 Phase 별 실행 — 12-14주 (sequence: spike → UI → capture → STT → 후처리 → polish → ship)

### Week 1 (2026-05-07 → 2026-05-13) — Capture Spike + 인프라

> **결정 (autoplan Phase 3 codex+architect)**: UI 보다 capture 검증 먼저.
> Spike scope 가 *원래 plan 보다 넓어짐* — 1시간 audio 캡처만으로는 Tauri-vs-Swift 결정 불가.
> *signed Tauri bundle + 두 window + NSPanel-equivalent + 1h stable + memory profile* 까지 봐야 함.

#### Spike 목표 (확장됨, ~5-7일)

**필수 (모두 ✅ 여야 Tauri 강행 결정)**:
- [ ] Tauri 2.0 + Rust 프로젝트 생성 (`pnpm create tauri-app .`)
- [ ] `screencapturekit-rs` (또는 fork) 로 ScreenCaptureKit binding 검증 — **Day 1 4시간 안에 audio capture 60초 WAV 검증, 실패 시 즉시 Swift sidecar 로 pivot**
- [ ] System audio capture **1시간** stable (YouTube 영상 1h 시청 시뮬레이션) — RSS peak < 800MB
- [ ] mic + system audio mixing — `presentationTimeStamp` drift < 50ms over 60min
- [ ] Opus 32kbps encoding + chunked write (5s rotation, crash safety)
- [ ] 권한 요청 플로우 (Microphone, Screen Recording) — **packaged + signed bundle 에서 검증** (Tauri dev 모드 는 entitlement 다름)
- [ ] **신호된 Tauri bundle 빌드** (Developer ID Application, Hardened Runtime, 필수 entitlements 만)
- [ ] **두 window 동시** — sidebar/main window + overlay window. 둘 다 활성화된 상태에서 capture 작동
- [ ] **`tauri-plugin-nspanel` (또는 자체 plugin) 검증** — overlay 가:
  - 항상 위 (`setLevel(.floating)`)
  - 영상 fullscreen 위에서도 보임 (`.fullScreenAuxiliary` collection behavior)
  - click-through toggle (`ignoresMouseEvents`)
  - drag/resize
  - macOSPrivateApi (transparent webview) — 직접 DMG 라 OK
- [ ] **macOS 15 (Sequoia) target 검증** — `screencapturekit-rs` mic feature 가 macOS 15+ 일 가능성. Sonoma 14 는 v1 minimum X.
- [ ] **Audio router pattern 검증** — 한 SCStream callback 이 3 stream 에 fan-out (Opus disk / STT websocket / RMS DRM detection). 메모리 누적 X
- [ ] **DRM detection PoC** — Apple TV+ 또는 Netflix 영상 캡처 시도, RMS 모니터링이 silence 를 잡는지

**보조 (강행에 필수는 아니나 봐야 함)**:
- [ ] **Anarlog (`fastrepl/anarlog`) 코드 정독** — 작동 패턴 차용 (Tauri+ScreenCaptureKit 살아있는 reference)
- [ ] Notarization workflow dry run (Apple Developer 계정 도착 전, 기존 키로 시뮬레이션 가능 시)

#### Spike 결정 gate (Day 4-5 시점)

| 결과 | 결정 |
|---|---|
| ✅ 모든 필수 통과 | **Tauri 강행** — Phase 0 UI 시작 (Week 2) |
| ⚠️ NSPanel/overlay 만 fail (audio OK) | **Tauri UI + 작은 Swift NSPanel plugin** (Anarlog 패턴) |
| ⚠️ system audio mixing 만 불안정 | **Tauri UI + Swift sidecar binary** for capture |
| ❌ Day 1 audio capture 자체 fail | **Native SwiftUI 즉시 pivot** — 디자인 시스템 SwiftUI 재작성 (1-1.5주 추가 인정). 이건 Day 1 안에 결정 |

#### 인프라 (~1시간, 병렬)
- [ ] heybartleby.com 결제 (Cloudflare/Porkbun, ~$11)
- [ ] GitHub org `heybartleby` 생성, repo `bartleby` 비공개 시작
- [ ] Twitter/X `@heybartleby` 핸들 선점
- [ ] Soniox 가입, API 키 발급 + **실제 가격 검증** ($0.12 vs $0.30/hr)
- [ ] OpenRouter 가입, API 키 + $5 충전
- [ ] Apple Developer 계정 신청 ($99/년, 1주 lead time — Day 1 시작)

#### Customer interview (~5시간, 사용자 시간 가능 시)
- [ ] 한국 indie dev / 학습자 / PM 5명 30분 interview
- [ ] 질문: "마지막 영어 YouTube 시청 후 뭐 하셨어요?", "영어 미팅 부담 어디서 옵니까?"
- [ ] 가설 검증: 영어 콘텐츠 소비 daily pain 인지, 미팅 suppressed demand 인지

**Week 1 acceptance**: spike 결과 (Tauri 강행 / sidecar / pivot) 결정. 인프라 셋업 완료. 가능 시 customer interview 5명.

---

### Week 2-3 (2026-05-14 → 2026-05-27) — Phase 0 + Phase 1 병렬

> Spike 가 ✅ 면 UI shell + audio refinement 병렬. ⚠️/❌ 면 Phase 1 우선.

#### Phase 0: Design system & UI shell (~1.5주)

NEXT.md Step 5 의 designer agent 위임 + 14 섹션 매핑 표 검증 (PRINCIPLES.md §2).

- [ ] CSS variables 전체 (color, typography, spacing, radius, shadow) — `design-system/.../tokens.css` 그대로 복사
- [ ] 폰트 임베딩: JetBrains Mono Variable + Inter Variable + Pretendard Variable + Cormorant Garamond + **Gowun Batang** + D2Coding (모두 OFL)
- [ ] Tailwind 4 + OKLCH 토큰 매핑
- [ ] 다크모드 자동 감지 + 수동 토글
- [ ] 컴포넌트 primitives (DESIGN.md L43~111 14 섹션 기준):
  - [ ] `<Button>` (4 × 3 sizes)
  - [ ] `<Input>` + `<BYOKKeyInput>` (verified/invalid)
  - [ ] `<Toggle>` `<Checkbox>` `<Segmented>` `<Select>`
  - [ ] `<Card>` `<MeetingCard>` `<TranscriptUtterance>` `<SummaryBlock>`
  - [ ] `<Sidebar>` + `<Titlebar>` (macOS chrome)
  - [ ] `<RecordingIndicator>` (idle/listening/processing/complete)
  - [ ] `<AudioMeter>` `<StatusStrip>`
  - [ ] `<Badge>` `<Dot>`
  - [ ] `<Toast>` `<Modal>` `<EmptyState>`
- [ ] 갤러리 페이지 (`/__gallery`) — 14 섹션 모두 시각 비교 가능
- [ ] App shell:
  - [ ] 사이드바 (240px, collapsible ⌘+\)
  - [ ] **모드 전환 UI** (시청 모드 ↔ 미팅 모드)
  - [ ] 메인 영역
  - [ ] 단축키 핸들러 (⌘⇧B 시청 / ⌘⇧M 미팅 / ⌘+\ / ⌘N / ⌘F / ⌘, / ESC)
- [ ] 라우팅:
  - [ ] `/` → Library
  - [ ] `/live/meeting` → 미팅 라이브
  - [ ] `/live/watch` → 시청 모드 (overlay 호출 트리거)
  - [ ] `/note/:id` → 노트 detail
  - [ ] `/settings`
- [ ] Empty state (캐릭터 톤)
- [ ] 14 섹션 매핑 표 ✅ 모두 차야 Phase 0 완료 (PRINCIPLES.md §2.2)

#### Phase 1: Audio capture refinement (~1.5주, Week 2-3 병렬)

Spike 결과를 production-grade 로 — autoplan eng review 의 architecture 권고 반영.

**SessionSupervisor — 12-state machine (Rust 단일 owner)**:
```
Idle → PermissionNeeded → Starting → Capturing → STTConnecting → Live
                                                      ↓
                                                 Reconnecting / Degraded
                                                      ↓
                                              Stopping → Saving → Complete → Idle
                                                            (Error → Idle)
```
- React 는 Tauri events 로 state 구독 (`session:state-changed`, `session:transcript-delta`, `session:translation-patch`, `session:overlay-lifecycle`). **polling X**.
- `start_*` 명령은 `Idle` 외 상태에서 typed error reject (idempotent).
- `stop_recording` async → `Stopping` 진입 → STT queue 5s drain timeout → 모든 pending translations 5s timeout → `Saving` → markdown write + audio finalize → `Complete` → `Idle`.

**Audio router** — 한 SCStream callback 이 fan-out 3 streams (peak RSS < 50MB, full session PCM 절대 buffer X):
1. **Opus encoder** → disk (chunked write 5s, file rotate at 60min for crash safety)
2. **STT sender** → 16kHz mono PCM downsample → bounded `tokio::sync::mpsc` (200ms backpressure) → Soniox websocket
3. **RMS calculator** → 8s ring buffer, dBFS → DRM detection heuristic

**Tauri commands**:
- `start_meeting()` → mic + system audio 캡처 시작
- `start_watch()` → system audio only
- `stop_recording()` → idempotent, async
- `get_session_state()` → 디버그용. React 는 events 사용
- `recheck_permissions()` → 권한 변경 후 재검증

**Permission lifecycle**:
- 모드별 graceful: Watch 모드는 Microphone 거부 OK (Screen Recording 만 필수). Meeting 모드는 둘 다 필수.
- 거부 시 `PermissionNeeded` 상태 + Settings.app deeplink:
  - `x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone`
  - `x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`
- "I've granted it" 버튼 → `recheck_permissions()` 호출

**DRM detection** (codex+architect 합의):
- 8-20초 동안 RMS < -60dBFS *while SCStream active and not paused* → DRM-blocked 신호
- 추가 hint: 캡처 source app bundle ID 가 known DRM list (`com.apple.TV`, `com.netflix.Netflix` 등) 면 즉시 surface
- UI: italic Cormorant *"Bartleby would prefer not to. (재생 영상이 보호되어 있는 것 같습니다.)"* + Dismiss / Stop
- 자동 stop X — 사용자가 단순히 quiet section 일 수도 있음. False positive cost 낮게.

**디스크 저장** — Storage schema 는 §3 Phase 3 참조 (`sessions/{uuid}/` 폴더 구조).

**Phase 0 + 1 acceptance**: 클릭 가능한 UI shell + ⌘⇧B/⌘⇧M 로 캡처 시작/종료, .opus 파일 저장, 시스템+마이크 오디오 둘 다 들림.

---

### Week 4 (2026-05-28 → 2026-06-03) — Phase 2: Streaming STT + Live UI

#### STT protocol (autoplan eng review 결과 — 1-3시간 안정성 위해 명시)

**모든 STT 이벤트는 monotonic seq# + audio-clock timestamp 들고 다님**:
```rust
struct SttEvent {
  seq: u64,                     // monotonic per session
  t_audio_ms: u64,              // audio-clock (not wall-clock), Soniox 의 processed_audio_ms
  kind: Partial | Final,
  text_en: String,
}
```

**Reconnect protocol** (network blip 대응):
- Exponential backoff: 1s → 2s → 4s → 8s → max 30s
- 캡처된 audio 는 **30s ring buffer** 로 보관 (disconnect 중 손실 X)
- Reconnect 시 last `t_audio_ms` 부터 ring buffer 에서 ~10s context replay
- 30s 초과 → drop + UI 에 *"Bartleby lost a moment."* surface
- Soniox 한 stream 최대 300분 — 그 전에 명시적 reconnect 도 OK

**Backpressure** (LLM 번역이 STT 보다 느릴 때):
- Translation queue depth 8 (bounded, `tokio::sync::mpsc::channel(8)`)
- Overflow 시: 가장 오래된 pending translation skip → EN-only 표시 + "(번역 보류)" badge
- STT ingestion 절대 block X (audio 손실 방지)

**Translation pipeline order preservation** (codex+architect critical):
- 모든 final → Solar Pro 3 호출 시 `seq` 동반
- React side: `Map<seq, TranslationState>` 유지
- Render = *contiguous prefix* of resolved + 다음 pending placeholder 만 (out-of-order 방지)
- `seq=N` 이 5s timeout 또는 fail → EN fallback 으로 unblock `N+1` 표시
- Single-flight gate per `seq` (retry 시 double-render 방지)
- 비용 최적화: 짧은 final 2-3개 (or 1-2초 window) 를 *batch* 해서 한 LLM 호출 — Settings 에서 latency vs cost 토글

**Persistent log** (crash safety):
- `transcript.jsonl` append-only WAL — 매 STT event 즉시 fsync
- Crash 후 재시작 시 마지막 fsync 지점부터 복구

#### 시청 모드 (priority 1 — 사용자 daily pain)
- [ ] Soniox websocket Rust client (Tauri 의 reqwest/tokio-tungstenite)
- [ ] System audio (16kHz mono PCM downsample) → websocket stream
- [ ] EN STT event 파싱 (partial / final, `t_audio_ms`, seq)
- [ ] **Floating overlay window** (Tauri + `tauri-plugin-nspanel` or 자체 plugin):
  - 자세한 spec → `design-system-extensions/overlay.md`
  - 7 states (idle/listening/captioning/translating/reconnecting/drm-blocked/permission-denied/complete)
  - Caption typography: **Pretendard sans** (PRINCIPLES §4.2.1 exception, NOT Gowun Batang)
  - Default: KO only. EN ⌥-hold toggle. Settings 에서 `caption-mode: ko | ko+en | en`
  - Background: translucent material + `backdrop-filter: blur(12px)`. Caption text 항상 100% opacity. Overall opacity 슬라이더 = background only
  - Drag/resize/click-through (⌥-click toggle)
- [ ] Solar Pro 3 streaming translation — order-preserving, batched 2-3 finals
- [ ] `transcript.jsonl` append-only WAL

#### 미팅 모드
- [ ] React: Live meeting 레이아웃 (사이드바 축소 + KO|EN 좌우 split)
- [ ] Bilingual STT (Soniox 의 language detection 또는 사용자 Settings 선택)
- [ ] Real-time translation (final → Solar Pro 3, 같은 order-preserving pipeline)
- [ ] LIVE indicator + timer
- [ ] 미팅 제목 인라인 편집
- [ ] 일시정지 / 재개 / 종료

**Phase 2 acceptance**: 본인이 영어 YouTube 1시간 시청 → 라이브 한국어 자막 overlay (네트워크 blip 한 번 simulate 해도 reconnect 작동). 별도로 영어 미팅 1시간 → KO|EN split panel 라이브 transcript. Peak RSS < 100MB.

---

### Week 5 (2026-06-04 → 2026-06-10) — Phase 3: 후처리 (요약 / 노트)

#### Storage schema (autoplan eng review — session 폴더 first-class)

**디렉토리 구조** — 각 세션이 폴더 (audio + transcript + note 한 묶음):

```
~/Documents/Bartleby/
├── sessions/
│   ├── {uuid}/
│   │   ├── note.md           ← user-facing markdown (frontmatter + 요약)
│   │   ├── audio.opus        ← Opus 32kbps (retention default 30일)
│   │   ├── transcript.jsonl  ← 모든 STT events append-only WAL (영구 보유)
│   │   └── events.jsonl      ← session lifecycle events (state changes, errors)
│   └── ... (uuid 별)
└── library.json              ← Library view 의 fast index (제목/날짜/tag/pin)
```

- **uuid**: nanoid 8자 (timestamp 기반 X — collision 안전)
- 사용자가 `note.md` 를 다른 곳으로 이동해도 audio link 살아있음 (frontmatter 의 `audio: bartleby://{uuid}` 내부 URI 가 app 에서 resolve)
- Audio retention sweep: `sessions/` 디렉토리 walk, frontmatter 가 30일 초과한 audio 자동 삭제 (transcript 는 영구)

#### note.md 시청 모드 frontmatter:

```yaml
---
version: 1
id: a3kf2m9p
type: watch
title: <YouTube 제목 또는 사용자 입력>
date: 2026-06-08T14:30:00Z
duration_s: 2820
source_url: <YouTube URL 또는 null>
source_app: <com.google.Chrome / com.apple.Safari / null>
audio: bartleby://a3kf2m9p
audio_checksum: sha256:abc123...
audio_retention_until: 2026-07-08
tags: []
pinned: false
---
## TL;DR
3-5 문장 한국어 요약

## Key Points
- 핵심 1
- 핵심 2

## Full Transcript (EN)
(영어 원본 — `transcript.jsonl` 에서 hydrate)

## Translation (KO)
(한국어 자막 — final 줄 누적)
```

#### note.md 미팅 모드 frontmatter:

```yaml
---
version: 1
id: b7zq8n4r
type: meeting
title: <auto-generated>
date: 2026-06-08T14:30:00Z
duration_s: 2820
language: ko / en / mixed
participants: [김시현, ...]
audio: bartleby://b7zq8n4r
audio_checksum: sha256:def456...
audio_retention_until: 2026-07-08
tags: []
pinned: false
---
## TL;DR
3-5 문장 한국어 요약

## Decisions
- 결정 1
- 결정 2

## Action Items
- [ ] @sihyun: X 하기 (2026-06-15 까지)

## Key Quotes
> "..." — 화자

## Full Transcript
(원본 — `transcript.jsonl` 에서 hydrate)
```

#### transcript.jsonl 형식 (append-only WAL):

```jsonl
{"seq":1,"t_audio_ms":0,"kind":"partial","text_en":"the model"}
{"seq":2,"t_audio_ms":850,"kind":"final","text_en":"the model handles long contexts surprisingly well","text_ko":"모델이 긴 문맥을 놀랍게 잘 처리합니다","translation_status":"ok","translation_ms":1240}
...
```

- Phase 1 부터 매 STT event 즉시 fsync — crash safety
- `note.md` 의 transcript 섹션은 이걸 hydrate 한 결과물 (저장은 jsonl 가 source of truth)
- 사용자가 `note.md` 본문 직접 편집 시 별도 `edits.jsonl` 에 patch 저장 (v1.5 — v1 은 단순 markdown 편집만)

#### 시청 모드 후처리

- [ ] 영상 끝나면 (Stop 또는 STT 5분 idle) → "한국어 요약 만들기" 옵션 다이얼로그
- [ ] 사용자 confirm → Solar Pro 3 호출 (전체 transcript → 5-10문장 TL;DR + 3-5 key points)
- [ ] `note.md` 작성 (위 frontmatter)
- [ ] Library 의 watch session 으로 등록

#### 미팅 모드 후처리

- [ ] Stop → 자동 요약 (Settings 에서 OFF 가능)
- [ ] Solar Pro 3 호출 (TL;DR + Decisions + Action Items + Key Quotes 항목별)
- [ ] Bartleby brand voice 시스템 프롬프트 ("정중하고 절제됨")
- [ ] `note.md` 작성 + Library 등록

- [ ] 사용자 편집 가능한 요약 view
- [ ] Bartleby brand voice 시스템 프롬프트

**Phase 3 acceptance**: 미팅 + YouTube 영상 둘 다 *그대로 슬랙·이메일에 paste 할 만한 한국어 요약 품질*.

---

### Week 6 (2026-06-11 → 2026-06-17) — Phase 4: Library (slim)

> 원래 plan 의 search / 일괄 export / iCloud 안내 등 일부 v1.5 로 미룸 (slip buffer).

- [ ] 모든 미팅 + 시청 노트 list view (type 필터 칩)
- [ ] **단순 검색** (제목 + 태그만, 본문 검색은 v1.5)
- [ ] 태그 추가/편집
- [ ] Pin (중요 노트 상단 고정)
- [ ] 노트 단건 detail view (타입별 layout)
- [ ] Markdown 단건 export
- [ ] 오디오 파일 retention 설정 (기본 30일 자동 삭제, transcript 영구)

**Phase 4 acceptance**: 한 달 dogfood 데이터 30개 노트로 검색·필터·열람 작동.

---

### Week 7-8 (2026-06-18 → 2026-07-01) — Phase 5: Polish + Dogfood

#### Week 7: 안정화
- [ ] 매일 본인 영상 + 미팅 dogfood
- [ ] 권한 거부 case
- [ ] 마이크 없음·끊김
- [ ] Soniox 연결 끊김 → reconnect with exponential backoff
- [ ] OpenRouter rate limit → backoff
- [ ] 디스크 가득 참 → 알림
- [ ] 세션 도중 앱 크래시 → 재시작 시 partial 복구

#### Week 8: 온보딩 + 베타
- [ ] First-launch 온보딩 (3 steps): API 키 입력 → 권한 → 첫 시청 모드 데모
- [ ] Settings UI (모델 선택, 저장 위치, retention, 단축키, overlay 위치)
- [ ] 5명 클로즈드 베타 모집:
  - 한국 indie dev / YouTuber / 학습자
  - 시청 모드 daily user 우선
- [ ] 베타 피드백 수집 → P0 만 수정

**Phase 5 acceptance**: 외부 베타 5명 중 *3명 이상 매일 시청 모드 1회+ 사용*.

---

### Week 9-10 (2026-07-02 → 2026-07-15) — Phase 6: Marketing prep

#### 랜딩 페이지 (heybartleby.com, Next.js)
- [ ] Hero: "Korean ears for English audio."
- [ ] 30초 데모 영상 (시청 모드)
- [ ] 미팅 모드 demo (보조)
- [ ] 다운로드 버튼 (DMG)
- [ ] Privacy 문구 (no-bot, BYOK, local markdown, DRM 차단 명시)
- [ ] Waitlist email capture (Resend / Buttondown)

#### 한국 indie community (사전)
- [ ] @heybartleby 트위터 활성화 (개발 일지 / 데모 클립)
- [ ] GeekNews / 한국 dev 디스코드 / 깃헙 README polishing
- [ ] dogfood 영상 자체 콘텐츠 (영어 tech talk 한국어 자막 시연)

#### 배포 prep
- [ ] DMG 빌드 + Developer ID 서명 + notarize (Apple Developer 승인 후)
- [ ] Privacy Policy + Terms (단순)
- [ ] **Tauri Updater plugin** (`tauri-plugin-updater`) — minisign 키, GitHub Pages JSON manifest, `.app.tar.gz` artifact. (autoplan: Sparkle 은 Swift 전용이라 Tauri 와 mismatch — Tauri Updater 가 first-party)

---

### Week 11-12 (2026-07-16 → 2026-08-12) — Phase 6 폴리시 + 출시

- [ ] 베타 피드백 P1 처리
- [ ] HN launch 준비:
  - Show HN: "Bartleby — Korean ears for English audio (YouTube + 미팅 라이브 자막)"
  - 오픈소스 여부 결정 (또는 source-available)
- [ ] Product Hunt launch 준비:
  - 영상, 스크린샷, copy
  - hunter 섭외 (또는 self-hunt)
- [ ] 한국 채널 동시 발행:
  - GeekNews
  - 디스코드/카카오 dev community
  - 트위터/X 한국 dev influencer

#### Buffer (Week 13-14)
- 일정 슬립 흡수
- 마케팅 wedge / 가격 final 결정 (사용 데이터 기반)

**Phase 6 acceptance**: 실제 배포 + waitlist 100명 + HN/PH 트래픽.

---

## §3 Risk Register (autoplan 업데이트 반영)

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Tauri+Rust ScreenCaptureKit 막힘** | 25% | High | Week 1 spike + Anarlog 코드 차용 + Swift sidecar/native pivot contingency |
| **Soniox 한국어/영어 정확도 부족** | 35% | Medium | Week 1 가입 시 본인 사용 케이스 직접 검증 + Whisper / Naver Clova 비교 |
| **Solar Pro 3 번역 품질 부족** | 35% | Medium | OpenRouter 라 Claude/Gemini 즉시 swap |
| **Granola 한국어 추가** | 40-50% (6개월) | High | 미팅만 — 시청 모드 wedge 살아있음. 영어 콘텐츠 소비 카테고리 사수 |
| **Anarlog Korean fork** | 25% | Medium | 한국어 deep optimization + 시청 모드 + 디자인 / 캐릭터 차별 |
| **12-14주 timeline 슬립** | 50% | High | Phase 4 search 일부 v1.5 buffer + Week 13-14 buffer |
| **Apple Developer 승인 지연** | 20% | Medium | Day 1 신청, 1주 lead time |
| **DRM 영상 시청 expectation** | low | Low | Advertised non-feature 명시 |
| **Mac App Store sandbox 호환성** | medium | Low | v1 cut, 직접 DMG 만 |
| **Customer interview 5명 모집 실패** | 30% | Low | dogfood 만으로 강행 가능 |

---

## §4 Success Metrics (v1 launch +30 days)

- waitlist 가입: 500+
- 베타 활성 사용자 (DAU): 50+
- 평균 세션/사용자/주: 5+ (시청 또는 미팅)
- **시청 모드 채택률**: 50%+ 사용자가 매주 1회+ 사용
- 한국 indie community 멘션: 20+
- HN 순위: 첫 페이지 도달
- Product Hunt: top 5 of the day

---

## §5 Stack & 디렉토리

### Stack (locked 2026-05-07, Week 1 spike 결과로 재검증)

| 영역 | 선택 |
|---|---|
| 언어/UI | Swift 5.9+ (또는 React+TS via Tauri) — spike 결과로 결정 |
| 시스템 레이어 | ScreenCaptureKit + AVFoundation |
| 영속 | 로컬 markdown file system |
| STT | Soniox streaming (BYOK, EN/KO) |
| 번역/요약 | Solar Pro 3 via OpenRouter (BYOK, 128K) |
| 단축키 | Tauri global shortcut 또는 native NSEvent |
| 최소 OS | **macOS 15 Sequoia** (autoplan: ScreenCaptureKit mic feature 가 macOS 15+ 일 가능성, 14 면 AVFoundation/CoreAudio fallback 코드 추가 필요. solo dev 비용 > target 시장 손실로 판단) |
| 아키텍처 | Apple Silicon + Intel universal |
| 배포 | Developer ID 직접 다운로드 + Tauri Updater plugin (minisign 서명) |

### 디렉토리 (Tauri 가정)

```
bartleby/
├── README.md, VISION.md, DESIGN.md, PRINCIPLES.md, PLAN.md, NEXT.md
├── design-system/          ← ⭐ 영구 read-only (PRINCIPLES.md §0)
├── src/                    ← React + TS frontend
│   ├── App.tsx
│   ├── components/         ← UI primitives + domain blocks
│   ├── components/gallery/ ← /__gallery 14 섹션
│   ├── modes/
│   │   ├── watch/          ← 시청 모드 (floating overlay)
│   │   └── meeting/        ← 미팅 모드 (sidebar view)
│   ├── library/            ← 노트 list + detail
│   ├── settings/
│   ├── lib/                ← util / store / hooks
│   └── styles/tokens.css   ← design-system 에서 복사
├── src-tauri/              ← Rust backend
│   ├── src/
│   │   ├── capture/        ← ScreenCaptureKit binding
│   │   ├── stt/            ← Soniox websocket
│   │   ├── translate/      ← OpenRouter / Solar Pro 3
│   │   ├── storage/        ← markdown file IO
│   │   └── lib.rs
│   └── tauri.conf.json
└── public/                 ← 폰트 / 아이콘 자산
```

(Native SwiftUI pivot 시 디렉토리 다름 — Week 1 spike 결과로 결정)

---

## §6 Next Decision Points (이 PLAN 외, 나중에)

- 가격 모델 확정 (v1.5 시점, 베타 피드백 후)
- 오픈소스 vs source-available (Phase 5 전)
- Mac App Store vs 직접 배포 (v1.5+, sandbox 검증)
- 브랜드 일러스트레이션·아이콘 (Phase 4 시작 전)
- 한국 베타 모집 채널 (Phase 4 시작 전)
- 클라우드 sync 자체 구축 vs Dropbox/iCloud 안내만 (v2.0)
- 시청 모드 → 후처리 노트 자동 생성 default 여부 (사용자 dogfood)
- 모드 전환 단축키 충돌 (`⌘⇧B`, `⌘⇧M`) 검증
- Follow-up email schema (v1.5 시그니처)

---

## §7 즉시 다음 액션 — Week 1

1. **Capture spike** (~3-5일):
   - Tauri 2.0 부트스트랩 (`pnpm create tauri-app .`)
   - `screencapturekit-rs` 또는 fork 검증
   - Anarlog (`fastrepl/anarlog`) 코드 정독
   - 1시간 YouTube 영상 system audio 캡처 + .opus 저장
   - mic + system mixing 검증
   - **Spike 결정 gate**: ✅ → Tauri 강행, ⚠️ → Swift sidecar, ❌ → SwiftUI pivot

2. **인프라** (~1시간 병렬):
   - heybartleby.com 결제
   - GitHub `heybartleby` org + Twitter `@heybartleby`
   - Soniox + OpenRouter 가입 + Soniox 가격 검증
   - Apple Developer 신청

3. **Customer interview** (~5시간, 가능 시):
   - 5명 30분 interview
   - 가설 검증

4. **Week 2 시작 조건**: spike 결정 + 디자인 시스템 codebase 진입 (designer agent NEXT.md Step 5)
