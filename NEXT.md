# Bartleby — Next Session Continuation

> 다음 세션에서 이 파일부터 읽고 진행.
> 마지막 세션: 2026-05-08 — **Day 1-14 ✅** (capture infra 12 days + Phase 0 디자인 시스템 entry + Soniox STT wedge 1차 검증)

---

## 현재 상태 (Day 14 ✅ 종료, 2026-05-08)

### 누적 commits (main branch)

| commit | 슬라이스 |
|---|---|
| `f927321` | Initial: VISION/DESIGN/PRINCIPLES/PLAN/NEXT + design-system handoff |
| `76d8ea8` | autoplan CEO reframe: "Korean ears for English audio" + 12-14주 |
| `1742fc3` | autoplan Phase 2+3: design-system-extensions + spike scope 확장 |
| `3733318` | autoplan minor: STT 벤치마크 + test fixture + DRM list |
| `7c8b295` | **Day 1 capture spike** ✅ — `~/Dev/_inbox/bartleby-spike` (60s WAV, screencapturekit 2.0, macOS 26 호환) |
| `827d893` | **Tauri scaffold** ✅ — react-ts/pnpm/Tauri 2 / com.heybartleby.bartleby / macOS 15 lock |
| `c17988e` | **Day 2 system-audio capture** ✅ live (sys: 500b/480000f/10.0s) |
| `ecac829` | **Day 3 mic+drift code path** ✅ (7/7 unit tests; SystemAudioSink + MicrophoneSink + drift helper) |
| `64496df` | **Day 3 mic infra** ✅ (Info.plist + build.rs sectcreate; empirical mic deferred) |
| `1f12876` | **Day 4 Opus 32kbps + 5s segments** ✅ live (sys: 500b / 2seg / 39.6KB / 0 drop) |
| `97a5ef9` | NEXT.md sync (Day 1-4 진행 결과 반영) |
| `eea6060` | **Day 5 1h stability** ✅ live (sys: 720seg / 14MB / 0 drop / RSS peak 135.8MB) — drift O(n+m) fix + RSS sampler |
| `4713c01` | NEXT.md sync (Day 5 결과 반영) |
| `9dc4644` | **Day 6 partial** ⚠️ tauri-nspanel 인프라 (두 윈도우 + setup hook 통과) — drag/transparent/fullScreenAuxiliary 3가지 후속 |
| `b092cc7` | NEXT.md sync (Day 6 partial + 미해결 명시) |
| `5e3ebd6` | **Day 6 finalize** ✅ Accessory activation policy + transparent CSS fix → fullScreenAuxiliary live verified (YouTube fullscreen 위 floating). drag 만 남음. |
| `77c307b` | NEXT.md sync (Day 6 ✅ finalize) |
| `d306b2e` | **Day 7 partial** ⚠️ Drag 3가지 시도 실패 — startDragging() JS handler 만 남김. nonactivating_panel + Accessory 가설 검증은 다음 세션 첫 probe. |
| `ce07dd5` | NEXT.md sync (Day 7 partial + 다음 세션 3 probes) |
| `ce29bd2` | **Day 7 slice** ✅ Overlay drag — codex+advisor parallel review 로 root cause triad 확정 (capabilities + acceptFirstMouse + nonactivating_panel). Live verified: 첫 클릭부터 inactive 상태에서 즉시 drag. |
| `f004883` | NEXT.md sync (Day 7 ✅ + Day 8 entry) |
| `adb4b83` | **Day 8 slice** ✅ Menu bar item (NSStatusItem) + main-close-to-hide — Show Bartleby / Quit, main close 시 hide 후 tray 로 re-summon. Live verified. |
| `7e61f7e` | NEXT.md sync (Day 8 ✅ + Day 9 entry) |
| `f6a3c46` | **Day 9 slice** ✅ DRM silence detection — capture/silence.rs (RMS + dBFS + DrmDetector, 11 tests) + CaptureStats `peak_system_dbfs` / `drm_detected`. YouTube -25.7 dBFS, Netflix(Widevine) -10.7 dBFS (not flagged), silent → -120 dBFS (flagged). |
| `6348b5f` | NEXT.md sync (Day 9 ✅ + Day 10 entry) |
| `fdea697` | **Day 10 slice** ✅ Overlay surfaces silence verdict — capture_dual_to_opus 가 AppHandle 받고 dedicated thread 가 ~3s 분량 sample 모이면 `drm_status` event emit. Overlay listen → "No audio detected." 텍스트 교체. 메시지는 mic cross-check 전까지 부드러운 톤 유지. |
| `71e7f63` | NEXT.md sync (Day 10 ✅ + Day 11 entry) |
| `f8329e1` | **Day 11 slice** ✅ ⌘⇧B global shortcut toggles main window — tauri-plugin-global-shortcut + global-shortcut:default 권한 + setup hook 의 on_shortcut. inactive 상태에서도 main hide ↔ show 토글 live verified. |
| `18d0315` | NEXT.md sync (Day 11 ✅ + Day 12 entry) |
| `6572a76` | **Day 12 slice** ✅ Auto-capture lifecycle — capture_dual_to_opus 가 (stop, max_seconds) 받아 signal-driven loop. `CaptureSession` + AppState Mutex. start_capture/stop_capture/capture_system_audio 3개 Tauri command. Live verified: Start → ~45s indefinite → Stop, -4.9 dBFS peak / 9 segments. |
| `958e921` | NEXT.md sync (Day 12 ✅ + Day 13 entry) |
| `60121f2` | **Day 13 slice + cleanup** ✅ Phase 0 entry — tokens.css copy + Section §00 Manifesto + §01 Color (gallery `?gallery` 분기). 3-lens review (CEO/Design/Eng) 후 큰 cleanup: CSS Modules + sections 분할 + lazy Gallery + theme-cascade + 6 폰트 embedding + production capture UI dress + PRINCIPLES.md §2.2 ship/polish gate split + spec drift fix. |
| *(uncommitted)* | **Day 14 spike — wedge 1차 검증** ✅ Soniox STT spike (`~/Dev/_inbox/bartleby-stt-spike/`, throwaway, Day 1 capture spike pattern mirror) — `stt-rt-v4` WebSocket 한국어/영어 wedge 1차 검증 통과. bartleby repo 에 코드 미반영 (Phase 2 시점에 from-scratch 재구현). Phase 2 STT critical risk retired. |

### 작동 검증된 것

- `pnpm tauri dev` → "Bartleby" 윈도우 + Rust IPC ↔ React frontend round-trip
- System audio 캡처 — Day 4: 10s → 500b / 480000f / 39.6KB / 2seg
- **System audio 1h capture (Day 5 acceptance)** ✅ — 3600.00s 정확 (172,800,000 frames @ 48kHz, frame ledger 로 sample drop 0 증명)
  - 720 Opus segments / total 14.0 MB compressed
  - RSS peak **135.8 MB** (budget 800MB 대비 5.9× 마진), start 130MB → end 134MB (+4.4MB / 60min, leak 사실상 0)
  - 60분 후 stop_capture → drift 즉시 종료 (O(n+m) two-pointer 통과)
  - mic=0 (예상대로 deferred)
- Opus encoder pipeline — mpsc channel + worker thread + rolling 5s segments, sample drop 0
- **메모리 bounded — empirical 검증 ✅** (Opus encoder flush 마다 disk 로 비움 + drift Vec append-only 11MB/h, 1h 안정)
- Drift 측정 helper — testable, **O(n+m) two-pointer** (이전 O(n×m) 가 1h ~360K trace 에서 분 단위 hang 일으킴), 4 unit tests
- RSS sampler — `proc_pidinfo(PROC_PIDTASKINFO)` 기반 own-process 샘플링 (5s 간격, CSV 로그), 1 unit test
- DRM silence detector — RMS / linear→dBFS / 누적 peak, 11 unit tests. YouTube -25.7 dBFS, Netflix(Widevine) -10.7 dBFS (정상), silent → -120 dBFS (flagged). 23 tests pass total.
- LC_RPATH `/usr/lib/swift` linker flag (Swift runtime ABI lib 위치)
- libopus 1.6.1 brew + audiopus_sys pkg-config 빌드 환경

### 작동 *안* 검증된 것 (의도적 deferred)

- **Mic 실 캡처** — Day 3 코드 + Info.plist 모두 들어가 있으나 dev mode 의 unsigned binary 에서 Apple SC daemon (`replayd`) 가 `with_captures_microphone(true)` 를 silently 무효화 (`micEnabled=0`). TCC 자체는 통과 (ffmpeg/AVFoundation 으로 cmux mic 정상 녹음 확인됨). SCStream mic feature 만 별도 enforcement. Apple Dev ID + `tauri build` 의 `.app` bundle (Hardened Runtime + signed) 시점에 풀릴 것으로 예측. PLAN.md L146 stance 와 일치.

### Day 6 결과 (live verified)

`tauri-nspanel` PoC empirically 통과:

- ✅ **fullScreenAuxiliary** — YouTube fullscreen 위 overlay 그대로 floating. Watch mode 의 product 핵심 wedge 검증 완료.
- ✅ **Transparent** — overlay 가 desktop 비치는 cream blur. App.css 의 `html, body, #root { background: transparent }` 명시 + `:root` 의 회색 background 를 `.container` 로 이동 (main only).
- ✅ **Activation policy = Accessory** (사용자 결정) — Dock icon 없음, overlay-first vibe 와 매칭. lib.rs 의 setup 에서 `app.set_activation_policy(ActivationPolicy::Accessory)`.
- ✅ **Always-on-top** (`PanelLevel::Floating`)
- ✅ 두 윈도우 동시 띄움, NSPanel 변환

### Day 7 결과 (live verified)

Overlay drag 완전 동작 — **3개 piece 모두 필요, 하나라도 빠지면 silent no-op**:

| Piece | 위치 | 역할 |
|---|---|---|
| `core:window:allow-start-dragging` 권한 + `windows: ["main", "overlay"]` | `capabilities/default.json` | 기본 `core:window:default` 는 start-dragging 제외. per-window list 가 `["main"]` 만이라 overlay 는 IPC drag 권한 0 이었음. |
| `acceptFirstMouse: true` | `tauri.conf.json` overlay window | wry 가 WKWebView 의 `acceptsFirstMouse:` 를 YES 로 override. 없으면 inactive panel 첫 클릭은 AppKit 이 window-key-order 용으로 swallow → drag.js 의 mousedown handler 도달 안 함. |
| `data-tauri-drag-region` attribute | `App.tsx` Overlay 의 outer div | Tauri 2 가 inject 한 native mousedown handler 가 `plugin:window|start_dragging` IPC 호출. async `getCurrentWebviewWindow().startDragging()` 의 React 통한 우회보다 직접적. |

NSPanel polish:
- `nonactivating_panel` style mask — overlay 클릭이 Bartleby app 을 활성화하지 않음. YouTube/Chrome focus 안 뺏김.
- `becomesKeyOnlyIfNeeded(true)` — panel 이 first responder 필요한 control 클릭 시에만 key 가 됨.

**5+ 시도 실패 후 codex + advisor parallel review 로 root cause 발견** — codex 가 capabilities 누락 + acceptFirstMouse API 정확히 지목, advisor 가 async startDragging() 의 sync 가정 오류 + scope question 제기. 이전 NEXT.md 의 3 probe 가설 (nonactivating / nspanel issues / is_floating_panel) 모두 falsified.

### Day 8 결과 (live verified)

Tauri 2 built-in `TrayIconBuilder` 로 Accessory tradeoff 해결 — 외부 plugin 불필요.

- ✅ Menu bar item (default window icon, `icon_as_template(true)` 로 dark/light auto)
- ✅ "Show Bartleby" / "Quit" 메뉴 항목, left-click 으로 메뉴 즉시 펼침
- ✅ Main window close → hide (`on_window_event` + `prevent_close()`), tray 의 Show 로 즉시 re-summon (webview rebuild 없음)
- ✅ Overlay 는 main close 와 무관하게 floating 유지

Cargo features: `tauri = { features = ["macos-private-api", "tray-icon", "image-png"] }`. `image-png` 는 bundle icon (PNG) 디코딩 용.

### Day 9 결과 (live verified)

DRM silence detection PoC — `capture/silence.rs` (pure helpers + DrmDetector accumulator) → CaptureStats 의 `peak_system_dbfs` / `drm_detected`. 1초 stereo 분량의 min_samples gate 로 zero-buffer false positive 방지.

| 케이스 | peak dBFS | drm_detected | Note |
|---|---|---|---|
| Silent system | -120.0 | true | sentinel — 진짜 무음 또는 DRM zero-fill 둘 다 동일 path |
| YouTube | -25.7 | false | 일반 음악/대사 레벨 |
| Netflix (Widevine) | -10.7 | false | Widevine 은 video-level 암호화, 시스템 오디오 silence X — false positive 회피 확인 |
| Apple TV+ (FairPlay) | n/a | n/a | local 미보유, 차후 verify. silent-system path 로 mechanism 은 검증됨 |

**개선 후속 (Phase 1+ 시점)**: silence vs. DRM 구분은 mic cross-check 로 가능 — system 무음 + mic 무음 = 그냥 조용한 환경, system 무음 + mic 정상 = DRM 의심. Mic 캡처가 풀린 시점 (Apple Dev ID + signed build) 에 추가.

### Day 10 결과 (live verified)

`drm_status` Tauri event + overlay listen — 캡처 중 ~3s 후 overlay 텍스트 자동 교체.

- ✅ `capture_dual_to_opus` 가 `&AppHandle` 인자 받아 dedicated thread 에서 detector polling
- ✅ ~3s 분량 stereo (`SAMPLE_RATE * 2 * 3` samples) 모이면 single-shot emit
- ✅ Overlay (App.tsx) `useEffect` + `listen<DrmStatusPayload>("drm_status", ...)` 으로 React state 업데이트
- ✅ YouTube → 텍스트 그대로 "Awaiting English audio." / Silent → "No audio detected."

**메시지 결정 (사용자 push-back)**: 무음 cause 가 다양 (mute / pause / 라우팅 / DRM) — mic cross-check 없이 단정 X. "Bartleby would prefer not to" 의 refusal line 은 mic cross-check 가 풀려 진짜 DRM 확정 가능한 시점 (Phase 1+) 까지 reserve. 지금은 neutral wording.

### Day 11 결과 (live verified)

⌘⇧B global shortcut → main window 토글. menu bar tray 의 power-user complement.

- ✅ `tauri-plugin-global-shortcut` v2 + `global-shortcut:default` capability
- ✅ `Shortcut::new(Some(SUPER | SHIFT), Code::KeyB)` + `on_shortcut(...)` 한 호출로 등록 + handler 바인딩
- ✅ 다른 앱 active 상태에서도 작동 (global), main hide ↔ show 토글
- ✅ Overlay 는 영향 없음 (separate label)

### Day 12 결과 (live verified)

Capture 가 fixed-duration blocking → signal-driven loop 로 리팩토링. 시청 모드 의 핵심 lifecycle infrastructure.

- ✅ `capture_dual_to_opus(stop: Arc<AtomicBool>, max_seconds: Option<u64>, ...)` — 100ms poll loop
- ✅ Tauri command 3개:
  - `capture_system_audio(seconds)` — legacy fixed-duration ("Capture Ns" 버튼)
  - `start_capture()` — indefinite, AppState 의 Mutex<Option<CaptureSession>> 에 session 저장. 이미 running 이면 error.
  - `stop_capture()` — session take(), stop flag 설정, thread join, stats 반환
- ✅ App.tsx Start/Stop 버튼 + `captureRunning` state cross-binding (disabled)
- ✅ App.css `:disabled` styling (Tauri webview 의 browser default 가 너무 subtle 했음)
- ✅ Live: Start → ~45s capture → Stop, peak -4.9 dBFS / 9 segments
- ✅ 23 tests still pass (capture signature 변경은 internal)

### Day 13 결과 (entry slice + 3-lens review cleanup)

Phase 0 디자인 시스템 entry. 19 섹션 한 슬라이스 X — Section §00+§01 만 진행 후 3-lens review (CEO / Design / Eng) → 큰 cleanup.

**Entry slice (gallery infra)**:
- ✅ `src/styles/tokens.css` — design-system/bartleby/project/bartleby/tokens.css **byte-exact 복사** (PRINCIPLES.md §0 sacred law)
- ✅ `src/gallery/Gallery.tsx` (44줄 switchboard) + `components/{DSSection,Swatch}.tsx` + `sections/00-Manifesto.tsx` + `sections/01-Color.tsx`
- ✅ `src/gallery/Gallery.module.css` (CSS Modules, kebab-case selector + bracket notation TS access. token utility classes 글로벌 유지)
- ✅ `src/App.tsx` `?gallery` URL 분기 + `lazy()` + `<Suspense>` (Gallery 별도 chunk: 6.80 kB)
- ✅ `GALLERY.md` — 19 섹션 매핑 표 + ship/polish Gate 컬럼 + ritual + 검증 워크플로우

**3-lens review reframe (Day 13 doubling-down 의 핵심)**:
- ✅ **CEO Concern A/B (CRITICAL)** → PRINCIPLES.md §2.2 의 19 ✅ hard gate 를 **ship gate 12 + polish gate 7** split. v1 launch acceptance = ship gate 12 만, polish 는 Phase 6.
- ✅ **CEO Concern D**: production capture UI 가 boilerplate (Vite/Tauri/React logos + "Welcome to Tauri+React" h1 + Greet form) → **dressed**. `<h1 className="display">bartleby</h1>` + `serif-quote` epigraph + `.btn` / `.btn-primary` (mono uppercase, paper-3 hover, ink-on-paper). App.css 의 :root Inter / hex `#0f0f0f` / `#f6f6f6` 모두 삭제, tokens.css OKLCH 토큰 사용.
- ✅ **CEO Concern E**: PLAN.md L198 명시한 **6 폰트 embedding** — JetBrains Mono · Inter Variable · Pretendard · Cormorant Garamond · Gowun Batang (5종 @fontsource) + D2Coding (4MB ttf, 직접 다운로드, OFL.txt 동봉). `src/styles/fonts.css` 에 모두 모음, main.tsx 에서 tokens.css 위에 import.
- ✅ **CEO Concern G + Design Fix-02**: spec drift `/__gallery` → `?gallery` (PLAN/PRINCIPLES/DESIGN 5 instances). Manifesto rule-item 한국어 mixed-run 에 `.kr-leading` 적용.
- ✅ **Eng High #1/#9**: `React.ReactNode` / `React.CSSProperties` UMD global → `import type { ReactNode, CSSProperties } from "react"` (Gallery.tsx + App.tsx).
- ✅ **Eng High #3**: Gallery `lazy()` + `<Suspense fallback={null}>` — capture-only / overlay-only 사용자가 Gallery code 다운로드 X.
- ✅ **Eng High #4**: CSS Modules 전환 + `.row` 충돌 fix (App.css `.row` → `.capture-row`, App.tsx 4 callers 동기). tokens.css `.row` 가 글로벌 utility 로 살아남음.
- ✅ **Eng Medium #6**: Color section theme-card 의 inline raw OKLCH → `data-theme="dark"` cascade (§15 Mode Switch 미리 검증). `var(--paper)` / `var(--ink)` 가 dark theme attribute 상에서 자동 swap.
- ✅ **Eng Medium #7**: Gallery.tsx 분할 (god-component risk 회피, §13 시점 3000줄 방지).
- ✅ **Eng Medium #5/#8**: main.tsx 의 import 순서 trap 주석 + Overlay 의 inline rgba TODO 주석 (Day 20+ §15 Mode Switch 시 token cascade 적용).

**검증** (Day 13 acceptance):
- `pnpm build` (tsc + vite): 0 errors, 417ms. Gallery chunk 6.80 kB / Gallery.css 2.80 kB 분리 확인.
- `cargo test --lib`: **23/23 pass**. capture infra 회귀 X.
- 본인이 매일 dogfood 하는 capture surface 가 *Bartleby 처럼 보임* (paper-ivory + display "bartleby" + Cormorant epigraph + mono caps 버튼).

**알려진 deferred** (NEXT.md / GALLERY.md 에 명시):
- Section §02-§18 의 17 sections — production rendering 시점 lazy 채움. Phase 0 acceptance = ship gate 12 row.
- Section §02 Typography 시점에 Gowun Batang 로드 검증 + kr-leading-bump CSS calc + pair-table border-radius+overflow Tauri WebView 호환 검증.
- Overlay (App.tsx L46 inline rgba) → token migration: Day 20+ §15 Mode Switch.

### Day 14 결과 (Soniox STT spike — wedge 1차 검증 ✅)

Phase 2 STT entry. spike binary `~/Dev/_inbox/bartleby-stt-spike/` (throwaway, Day 1 capture spike pattern mirror) 로 critical risk 우선 retire. bartleby repo 에 코드 미반영 — Phase 2 시점에 Tauri 안에서 from-scratch 재구현.

**Pipeline 검증 (코드)**:
- ✅ WebSocket connect (`wss://stt-rt.soniox.com/transcribe-websocket`) + `native-tls` (macOS Secure Transport, rustls 의 CryptoProvider 이슈 회피)
- ✅ Initial config JSON: `{model:"stt-rt-v4", audio_format:"pcm_s16le", sample_rate:16000, num_channels:1, language_hints:["en","ko"], enable_endpoint_detection:true, enable_language_identification:true}`
- ✅ Binary audio frames @ 120ms chunks (3840 bytes / 1920 samples / s16le mono), real-time pacing
- ✅ End-of-stream signal = empty text frame
- ✅ Server response parse — `tokens[].{text, is_final, language, speaker, translation_status}` + `finished` + `error_code`/`error_message`
- ✅ WAV → 16kHz mono s16le 변환 (channel average + linear interpolation resample, speech <4kHz 라 aliasing 무시)
- ✅ Server-close-aware sender (Arc<AtomicBool> abort flag — error 시 chunk loop 즉시 중단)

**검증 결과 (3 케이스 / 60s 각)**:

| 케이스 | finals | LID | 결과 |
|---|---|---|---|
| Day 1 영어 음악 (M.I.A. Paper Planes 추정) | 101 | 100% en | ~90% (음악 가사 치고 매우 좋음, 일반 speech 기대치 더 높음) |
| 한국어 AI 강연 60s | 413 | 410 ko / 3 ? | "이렇게 되게 좋아졌다라는 수치들이 있는데..." 사실상 완벽, 띄어쓰기·받침·어미·문장부호 다 잡음 |
| 영어 Claude 강연 60s | 393 | 392 en / 1 ? | "Limits for Claude code... first Code with Claude event of 2026..." 사실상 완벽, 자연 conversational lecture |

**비용**: 3분 STT 사용 = ~$0.011 (Soniox real-time 분당 $0.0036). $5 충전 = ~22시간 STT, Phase 2 통합 검증 + 사용자 dogfood 충분.

**Phase 2 critical risk retired** — Soniox 한국어 + 영어 양방향 production-quality 확인. Day 15+ Tauri 통합 진입 안전.

**Spike 진행 중 fix 한 것**:
- Initial try: `tokio-tungstenite` 의 `rustls-tls-webpki-roots` feature 만 → rustls 0.23 의 default CryptoProvider 미설치 panic. `native-tls` feature 로 swap (macOS 자체 Secure Transport, simpler). Production Bartleby 의 TLS choice 는 Phase 2 dep audit 시점에 확정.
- `error_code` deserialize: doc 예시는 string 추정이었으나 실제 server 는 integer (402) 전송. Type 을 `Option<serde_json::Value>` 로 완화.
- Server close 후 sender 의 "Sending after closing" panic. `Arc<AtomicBool>` abort flag 로 reader 가 close/error 감지 시 sender 가 즉시 break.

**Soniox 결제**: $5 충전 (free tier 자동 적용 안 됨, 신규 가입 시 balance 0 상태). Production 사용은 BYOK pattern 그대로.

**Lane B 진행 상황 갱신**:
- ✅ Soniox API key + $5 잔액 — `~/.config/secrets/soniox.env`
- ✅ OpenRouter API key — `~/.config/secrets/openrouter.env` ($5 충전 권장, Day 16+ Solar Pro 3 번역 시점)
- ⏳ Apple Developer 신청 ($99/년, 1주 lead time) — Phase 1+ mic empirical 의 prerequisite, Phase 2 와 별개

**Evidence (참조 only)**:
- `~/Dev/_inbox/bartleby-stt-spike/samples/{01-day1-music-paperplanes,02-korean-ai-lecture,03-english-claude-event}.log` — 세 케이스 raw partial+final stream 보존
- `~/Dev/_inbox/bartleby-spike/{korean,english_lecture}.wav` — Day 14 fresh capture WAV (60s @ 48kHz stereo f32)

**알려진 deferred (Phase 2 통합 시)**:
- Resampling 은 spike 의 linear interpolation. Production 은 rubato / samplerate 등 proper anti-aliased 필터 (음악·고주파 컨텐츠 검증에는 차이 날 수 있음)
- `enable_speaker_diarization` 미사용. 미팅 모드에서 활성화 (Phase 3+)
- Mid-stream 끊김 reconnect (PLAN.md L329-389 spec) 미구현 — Phase 2 본진
- TLS choice (rustls vs native-tls) production 결정 — Phase 2 dep audit 시점

### 환경 (재현용)

- Bartleby repo: `~/Dev/side/bartleby/`
- Spike binary (참조 only, 코드 복사 금지): `~/Dev/_inbox/bartleby-spike/`
- macOS 26 (Tahoe), Rust 1.95, Tauri 2.x, Vite 7, React 19
- `.cargo/config.toml` (project root): rpath flag + PATH=/opt/homebrew/bin
- `src-tauri/Info.plist`: NSMicrophoneUsageDescription / NSScreenCaptureUsageDescription / NSCameraUsageDescription

---

## 다음 세션 진입점

### Step 0: 컨텍스트 빠른 로드

```bash
cd ~/Dev/side/bartleby
git log --oneline -10  # 마지막 commit 확인
```

읽을 파일 (이미 다 작성됨, 변경 적게):
1. **`NEXT.md`** (이 파일) — 현재 상태
2. `VISION.md` — 비전 (변경 X)
3. `PRINCIPLES.md` — 디자인 구현 원칙 (변경 X)
4. `PLAN.md` — Phase 0-6 (Day 1-4 진행을 PLAN 의 Phase 1 spike 와 매핑)

### Step 1: Day 13 — Phase 0 entry (Section §00 + §01) ✅ *완료*

자세한 결과는 위 "Day 13 결과" 섹션 참조. Phase 0 잔여 §02-§18 (ship gate 11 row + polish gate 7 row) 는 production rendering 시점 lazy 채움.

### Step 2: Day 14 — Phase 2 STT entry ✅ *완료*

자세한 결과는 위 "Day 14 결과" 섹션 참조. Lane B (Soniox + OpenRouter key) 완료, spike binary 통과, 한국어 + 영어 conversational lecture production-quality 검증. Phase 2 STT critical risk retired.

### Step 3: Day 15 — Tauri 통합 (capture → STT → overlay caption) ← *다음 슬라이스*

bartleby repo 안에서 from-scratch 재구현 (spike 코드 복사 금지, 패턴만). drm_status event pattern mirror.

#### A. STT module 추가 (Rust side)
- [ ] `src-tauri/src/stt/` 모듈 — Soniox client (websocket + config + binary frame send + token parse)
- [ ] `tokio-tungstenite` + `native-tls` (또는 rustls + ring 으로 production 최종 결정 시점) feature 추가
- [ ] 16kHz mono PCM s16le 로 SystemAudioSink 의 f32 buffer 변환 helper (Phase 2 시점엔 rubato 등 proper resampler 검토. spike 의 linear interpolation 은 wedge 검증 용이었음)
- [ ] `STT_API_KEY` env var 또는 settings.json (BYOK) 로딩 — Phase 2 후반 §16 Settings UI 에 정식 입력 surface
- [ ] Token unit tests (config JSON shape, server message parse, error_code as integer)

#### B. Capture pipeline 연결
- [ ] `capture_dual_to_opus` 가 system audio f32 stream 을 STT module 에 mpsc 로 fan-out (기존 Opus encoder 와 병렬, 둘 다 같은 source consume)
- [ ] STT thread 가 16kHz mono s16le 로 변환 + 120ms chunk 로 Soniox 에 stream
- [ ] `stt_partial` / `stt_final` Tauri event emit (`drm_status` pattern 그대로 — `&AppHandle` 받아 `app.emit(...)`)
- [ ] Server close / error 시 `stt_error` event + auto-reconnect (PLAN.md L329-389 spec — 1→2→4→8→max 30s exponential backoff, 30s ring buffer audio)

#### C. Overlay caption surface
- [ ] App.tsx Overlay 의 listener 추가 (`listen<SttPartialPayload>("stt_partial", ...)` + final). drm_status 와 동일 패턴.
- [ ] partial 은 italic / final 은 plain 같은 visual cue (디자인 시스템 §11 LiveCaption gallery 시 정식)
- [ ] 영어 자막 1차 (한국어 번역은 Day 16+ Solar Pro 3 통합 시점)
- [ ] Empty state (capture stopped / DRM detected / no audio) 메시지 기존 drm_status 와 통합

#### D. Acceptance (Day 15 결정 gate)
- [ ] YouTube 영어 강연 1분 시청 → overlay 에 자연스러운 라이브 자막 (latency 1-2초 내, partial→final 흐름 자연)
- [ ] 끊김 한 번 simulate (Wi-Fi 잠깐 토글) → 자동 reconnect, 30s 분량 audio 누락 없이 재개
- [ ] Peak RSS 1h 시청 시 < 200MB (capture-only 1h 가 135MB 였으니 STT thread 추가 여유 60MB 정도 budget)

### Step 4: Day 16+ — Solar Pro 3 KO translation pipeline

- [ ] OpenRouter Solar Pro 3 streaming translation
- [ ] Order-preserving (`seq` per final, `Map<seq, TranslationState>`, contiguous prefix render)
- [ ] Bounded translation queue depth 8 + EN fallback on timeout/skip
- [ ] Reconnect protocol (1→2→4→8→max 30s exponential backoff, 30s ring buffer audio)
- [ ] PLAN.md L329-389 spec 그대로

### Step 5: Day 17+ — Phase 2 acceptance

본인이 영어 YouTube 1시간 시청 → 라이브 한국어 자막 overlay (네트워크 blip 한 번 simulate 해도 reconnect 작동). **wedge 1차 검증 완료**. Peak RSS < 100MB.

### Step 6: Phase 0 잔여 17 sections — lazy fill

- §02 Typography: Section 02 진입 시 prep notes 는 GALLERY.md §02 Notes 컬럼 참조 (Risks 4개)
- §16 Settings UI: Phase 2 acceptance 후 BYOK key field (사용자가 ENV var 대신 UI 로 입력)
- §14 WatchOverlay: 이미 overlay 가 production 작동 중 — gallery 의 §14 spec 비교는 Phase 2 마무리 시점
- 나머지 sections: Phase 6 polish 시점

### Step 3 (이전): Two-window + tauri-plugin-nspanel — *완료* (Day 6 ✅)

PRINCIPLES + design-system-extensions/overlay.md 의 spec — drag (Day 7) + tray (Day 8) 까지 verified.

### Step 4: Lane B 인프라 (사용자 직접, ~1시간)

- [ ] heybartleby.com 결제 (Cloudflare 또는 Porkbun)
- [ ] GitHub org `heybartleby` + repo bartleby (private)
- [ ] Twitter/X `@heybartleby` 핸들 선점
- [ ] Soniox 가입 → API key (`~/.config/secrets/soniox.env`)
- [ ] OpenRouter 가입 → API key + $5 충전
- [ ] **Apple Developer 신청 ($99/년, 승인 1주)** ← Day 3 mic empirical 의 prerequisite

### Step 5: 디자인 시스템 코드 구축 (Phase 0 본진)

이전 NEXT.md 의 designer 위임 가이드 그대로 — `/__gallery` 라우트로 14→19 섹션 1:1 매핑. 자세한 위임 prompt 는 git history (commit `f927321` ~ `3733318`) 또는 별도 노트 참조. 우선순위는 capture 1h 검증 통과 후 (Phase 1 → Phase 0 reordering 그대로).

---

## 핵심 결정사항 (변경 시 PLAN.md / VISION.md 같이 갱신)

```
Brand:      Bartleby
Domain:     heybartleby.com
Bundle ID:  com.heybartleby.bartleby (locked, 변경 X)
Stack:      Tauri 2.0 (Rust + React + TS) — Day 4 까지 작동 ✅
            Tauri Updater plugin (Sparkle 제거)
최소 OS:    macOS 15 Sequoia (locked in tauri.conf.json)
Capture:    screencapturekit 2.0 (svtlabs) — system audio ✅, mic deferred
Encoding:   Opus 32kbps stereo + Ogg + 5s rolling segments ✅
Storage:    sessions/{uuid}/{note.md, audio.opus[-NNN], transcript.jsonl, events.jsonl}
            (현재 임시: $TMPDIR/bartleby-{system,mic}-{ts}-{seg:03}.opus)
            bartleby://{uuid} 내부 URI (사용자가 .md 이동해도 audio link 살아있음)
STT:        Soniox streaming (BYOK, EN/KO 양방향). 다음 슬라이스 - Phase 2.
LLM:        Solar Pro 3 via OpenRouter (BYOK, 128K context)
First user: 본인 (Sihyun) — 매일 영어 YouTube 1h+ 시청
Wedge:      Korean ears for English audio (시청 + 미팅 dual mode)
Layout:     사이드바 240px + 가변 main + floating overlay (시청 모드)
모드:       시청 (system audio only, overlay) ↔ 미팅 (mic+system, sidebar)
Font:       Pretendard (live caption sans) + Gowun Batang (notes serif) + D2Coding (mono)
            모두 OFL, Tauri 번들 자유
Color:      OKLCH chroma 0 (paper-ivory + ink, ZERO accent color)
Timeline:   12-14주
Sequence:   Week 1 capture spike (Day 1-4 ✅) → Day 5+ 1h stability → Phase 0 UI → Phase 2 STT
검증 표:    19 섹션 (overlay + mode-switch + settings + onboarding + permission)
SessionFSM: 12 states (구현 시점은 Phase 1+ 이후)
```

---

## 외부 reference (참조 only, 코드 복사 절대 금지 — 사용자 명시 원칙)

- **Anarlog** (`fastrepl/anarlog`) — Tauri+ScreenCaptureKit 미팅 노트 패턴
- **Soniox docs** — streaming STT websocket
- **OpenRouter docs** — Solar Pro 3 API
- **Tauri 2.0 docs** — macOS-specific 권한·메뉴바·단축키
- **screencapturekit-rs 2.0 source** (`~/.cargo/registry/src/.../screencapturekit-2.0.0/`) — Day 3 mic API 검증 시 grep 한 곳

---

## Risk Watch

| Risk | 현재 상태 | Mitigation |
|---|---|---|
| ScreenCaptureKit Rust binding | ✅ Day 1-4 통과 | screencapturekit 2.0 (svtlabs), 결정 |
| 1h stability + RSS | ✅ Day 5 통과 | RSS peak 135.8MB / 720 seg / drop 0 / drift hang 없음 |
| Mic 실 캡처 | ⏳ Apple Dev ID 후 | Info.plist + code path 다 들어감, signing 만 남음 |
| nspanel fullScreenAuxiliary | ✅ Day 6 통과 | Accessory + nspanel collection behavior, YouTube fullscreen 위 floating live 검증 |
| Overlay drag | ✅ Day 7 통과 | capabilities + acceptFirstMouse + nonactivating_panel triad. inactive 첫 클릭부터 drag, focus stealing 없음 live verified. |
| Main 윈도우 호출 (Accessory tradeoff) | ✅ Day 8 통과 | TrayIconBuilder + on_window_event hide. main close 시 hide → tray 의 Show 로 즉시 re-summon. Live verified. |
| DRM detection (capture path) | ✅ Day 9 통과 | silence.rs (11 tests) + CaptureStats peak_system_dbfs/drm_detected. YouTube/Netflix/silent 모두 verify. |
| Overlay surface (silence verdict) | ✅ Day 10 통과 | drm_status Tauri event + Overlay listen → 자동 텍스트 교체. 메시지는 mic cross-check 전까지 neutral. |
| Hot key (⌘⇧B global summon) | ✅ Day 11 통과 | tauri-plugin-global-shortcut + global-shortcut:default. main hide ↔ show 토글, inactive 상태에서도 작동. |
| Auto-capture lifecycle | ✅ Day 12 통과 | signal-driven loop + AppState session + start/stop Tauri command. ~45s indefinite capture live verified. |
| Phase 0 디자인 시스템 entry | ✅ Day 13 통과 | tokens.css byte-exact + Section §00/§01 gallery + 6 폰트 embedding + production capture UI dressed + ship/polish gate split. Lazy chunk (Gallery 6.80 kB) 분리. |
| Soniox STT 정확도 (한/영) | ✅ Day 14 통과 | spike binary (~/Dev/_inbox/bartleby-stt-spike/) — 한국어 AI 강연 60s + 영어 Claude 강연 60s 모두 conversational lecture 사실상 완벽, LID 99%+. Phase 2 통합 안전. Whisper/Clova 비교는 Phase 2 acceptance 후 optional. |
| Watch mode toggle (overlay + capture) | ⏳ Phase 2 후 | overlay 와 capture 가 STT pipeline 으로 연결되면 mode toggle 자연스럽게 reify. CEO reframe 에서 Day 14 단독 슬라이스 X. |
| Mic / Speaker cross-check (DRM 확신) | ⏳ Phase 1+ | Apple Dev ID 후 mic 풀리면 system 무음 + mic 정상 → DRM 확정 |
| Soniox 한국어 정확도 | Phase 2 시 | Naver Clova / Whisper 비교 |
| Solar Pro 3 요약 품질 | OpenRouter 즉시 swap 가능 | Claude / Gemini fallback |
| Apple Developer 승인 지연 | Lane B 큐, ~1주 | 다음 세션 사용자 신청 권장 |

---

## 명령어 cheat sheet

```bash
# 프로젝트 진입
cd ~/Dev/side/bartleby
source ~/.cargo/env

# Dev (~1-2분 incremental, 첫 빌드는 5-10분)
pnpm tauri dev

# 단위 테스트 (23개 — planar 3 + drift 4 + opus 4 + rss 1 + silence 11)
cargo test --manifest-path src-tauri/Cargo.toml --lib

# Frontend build + type check
pnpm build

# Gallery 시각 검증 (외부 브라우저, 1280px+ width)
# → http://localhost:1420/?gallery
# 원본 비교: cd design-system/bartleby/project && python3 -m http.server 8081

# Production build (Phase 6 시점)
pnpm tauri build

# Opus segment 검증
ffmpeg -i $TMPDIR/bartleby-system-{ts}-000.opus -af volumedetect -f null /dev/null
```

---

## Day 1 spike binary 위치 (참조 only)

```
~/Dev/_inbox/bartleby-spike/
├── Cargo.toml         (screencapturekit 2.0, hound 3.5, anyhow 1, bytemuck 1)
├── .cargo/config.toml (rpath linker flag for /usr/lib/swift)
├── src/main.rs        (60s system audio → output.wav)
└── output.wav         (60s, 99.9% non-zero, peak -18.41 dBFS)
```

Throwaway reference. 다시 살펴볼 일 거의 없음. 코드 복사 금지 (memory rule).

---

## 마지막 한 줄

> "Bartleby floats, moves, listens until told to stop, surfaces silence, answers to ⌘⇧B, wears his own colors, **and now hears Korean and English at production quality**. Day 15: capture → Soniox → overlay caption (Tauri 통합), 라이브 영어 자막 1차."
