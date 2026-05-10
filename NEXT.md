# Bartleby — Next Session Continuation

> 다음 세션에서 이 파일부터 읽고 진행.
> 마지막 세션: 2026-05-10 — **Day 1-19a ✅** (capture infra 12 days + Phase 0 entry + Soniox STT wedge 검증 + Tauri STT 통합 + Solar Pro 3 한국어 번역 + streaming SSE + STT reconnect + §16 Settings UI + **§02 Typography gallery**)

---

## 현재 상태 (Day 19a ✅ 종료, 2026-05-10)

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
| *(external — spike repo only)* | **Day 14 wedge 검증** ✅ Soniox STT spike (`~/Dev/_inbox/bartleby-stt-spike/`, throwaway, Day 1 capture spike pattern mirror) — `stt-rt-v4` WebSocket 한국어/영어 wedge 1차 검증 통과. bartleby repo 에 코드 미반영, Phase 2 시점에 from-scratch 재구현. Phase 2 STT critical risk retired. 결과 문서화는 `4b744c2` 의 NEXT.md sync. |
| `4b744c2` | NEXT.md sync (Day 14 ✅ + Day 15 entry) |
| `c88ff34` | **Day 15a slice** ✅ Tauri STT 통합 — `src-tauri/src/stt/{mod,soniox,resample}.rs` + capture fan-out + lib.rs wire + Overlay caption listener. Live: 영어 YouTube 30s → 라이브 자막 자연 흐름. drift 0.00ms / peak RSS 128MB / 27 tests pass. |
| `734b0c2` | **Day 16a slice** ✅ Solar Pro 3 한국어 번역 — `src-tauri/src/translate/{mod,upstage}.rs` + STT final fan-out to translator + Overlay 한국어 caption. Sequential depth=1 (order preserved by design). **Wedge "Korean ears for English audio" 완성 layer.** Upstage 직접 API (OpenRouter pool 차단 우회). Live: 영어 lecture → 영어 + 한국어 두 줄 caption. |
| `5d3c843` | **Day 16b slice** ✅ Solar Pro 3 streaming SSE — `translate/upstage.rs` 가 `stream:true` POST + `bytes_stream()` + `\n\n`-delimited event 파싱. UTF-8 boundary 안전 (한글 3바이트 chunk 경계 자르더라도 buffer accumulation). `translation_partial` per delta token + `translation_final` on `[DONE]`. Frontend `koPartial` state + opacity 0.65 partial 렌더 + final commit 시 cancel. Live: 한국어가 토큰 단위로 흐름. Sequential depth=1 유지. |
| `c5f1e8b` | NEXT.md sync (Day 16b ✅ + Day 15b entry) |
| `3d74e95` | **Day 15b slice** ✅ STT reconnect + 30s ring buffer — `stt/ring.rs` 신규 (VecDeque<Vec<u8>>, 960KB cap, 6 unit tests). `stt/soniox.rs` `run_session` reconnect-aware. `stt/mod.rs::run_with_reconnect` 가 1→2→4→8→16→30s exponential backoff (cap 10 ≈ 3.3min). 33 tests pass. Empirical 1h dogfood 는 Day 17. |
| `97c2eee` | NEXT.md sync (Day 15b ✅ code + Day 17 entry) |
| `37ce803` | NEXT.md: Day 17 dogfood guide (pre-flight + monitoring + simulate + post-run measurement form). 코드 변경 X. |
| `a7c62b1` | **Day 18a slice** ✅ §16 Settings UI Tab 1 BYOK keys — `secrets.rs` (keyring crate 3, macOS Keychain wrapper) + 4 Tauri commands + `resolve_key` (Keychain → ENV fallback) + verify probes (Soniox WS handshake / Upstage ping). Frontend `KeyInput` (from-scratch) + `Settings` modal (5 tabs surfaced, 4 disabled) + main toolbar gear + first-launch banner. 33 tests pass + 1 ignored. |
| `2248229` | NEXT.md sync (Day 18a ✅ + Step 3f) |
| `0b5d7b5` | Day 18a fix: `.container { position: relative }` so `.settings-gear` anchors to hero, not viewport. |
| `1644eb2` | NEXT.md: autopreso inspiration 기록 (Phase 4 미팅 모드 본진 spike 시점). |
| `3b0bf78` | **Day 18b slice** ✅ §16 Settings UI Tabs 2-5 + Overlay wire — Settings 분할 (`src/settings/{Settings,KeysTab,ModesTab,StorageTab,ShortcutsTab,AboutTab}`) + 공통 form primitives (`src/components/{Toggle,Segmented,Slider}` from-scratch, design tokens only). Overlay listen `prefs_changed` → caption_mode (KO/KO+EN/EN 분기), overlay_opacity (background alpha), caption_font_size (KO layer px) 즉시 반영. Storage-only: overlay_position / pause / click-through / bilingual / auto_summarize / summary_lang / retention (consumer infra 추후). Tab 3 Choose.../Finder/Clean up disabled (tauri-plugin-fs/dialog), Tab 4 Customize... disabled (global-shortcut dynamic re-register). Tab 5 About v0.1.0 hardcoded. 21 files +1245 lines. 33 tests pass + 1 ignored, pnpm/cargo build clean. |
| `cc300b0` | **Day 19a slice** ✅ §02 Typography gallery — `src/gallery/sections/02-Typography.tsx` (신규) + Gallery.tsx import/render + Gallery.module.css §02 CSS block. 4 font specimens (Pretendard 4w / Gowun Batang 2w / Cormorant Garamond regular+italic / JetBrains Mono 2w), type scale table (--t-xs ~ --t-5xl), tracking comparison (4 token × BARTLEBY), font role grid. Design tokens only. 33 tests pass + 1 ignored, pnpm/cargo build clean. |

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

### Day 15a 결과 (Tauri STT 통합 — 라이브 영어 자막 ✅)

Phase 2 본진 진입 — spike 패턴을 bartleby repo 안에 from-scratch 재구현 (memory rule: 외부 reference 코드 복사 금지). System audio → Soniox → Overlay 라이브 자막 happy-path 작동.

**구조 (5 파일 신규/수정)**:
- `src-tauri/src/stt/mod.rs` — `SttSession` (stop flag + join handle), `start(api_key, app)` 가 `(Sender<Vec<f32>>, SttSession)` 튜플 반환. dedicated std::thread 가 current_thread tokio runtime 소유. Bridge: sync mpsc → resampler → tokio mpsc → ws sender.
- `src-tauri/src/stt/resample.rs` — `Resampler` 가 48kHz interleaved stereo f32 → 16kHz mono PCM s16le streaming 변환. 채널 평균 + linear interpolation + 120ms (1920 samples) 단위 chunk 누적. 4 unit tests.
- `src-tauri/src/stt/soniox.rs` — `run_session(api_key, app, chunk_rx, stop)` async. `wss://stt-rt.soniox.com/transcribe-websocket` + `model:"stt-rt-v4"` + lang_hints `[en, ko]` + endpoint detection on. Reader task 가 token 파싱해서 `stt_partial` / `stt_final` / `stt_error` Tauri event emit. Per-message partial reset (live debug 에서 발견한 핵심 버그 — Soniox 는 매 message 마다 *current* partial slate replace, 우리가 그걸 append 하면 끝없이 길어짐).
- `src-tauri/src/capture/system_audio.rs` — `SystemAudioSink` 에 `stt_sender: Option<Sender<Vec<f32>>>` 추가, `route_audio_buffer` 가 Opus encoder 와 STT 양쪽 fan-out (`interleaved.clone()` — 버퍼 한 chunk ~7.5KB, alloc bounded). `capture_dual_to_opus` signature 에 `stt_sender` 파라미터 추가.
- `src-tauri/src/lib.rs` — `spawn_capture` 가 `SONIOX_API_KEY` env var present 시 `stt::start` 호출, 반환된 sender 를 capture 에 move. `CaptureSession` 에 `stt: Option<SttSession>` 저장. `stop_capture` / `capture_system_audio` 가 `join_stt` 로 stop flag + thread join.
- `src/App.tsx` Overlay — `stt_partial` / `stt_final` / `stt_error` 3개 listener. final 은 누적 (220 char rolling window), partial 은 replace, partial→empty transition 도 한 번 emit. partial 0.55 opacity (흐릿) → final 진해짐 (visual cue, 디자인 §11 LiveCaption 시점에 token migration).
- `src-tauri/Cargo.toml` — `tokio` (macros+rt-multi-thread+time+sync) + `tokio-tungstenite` (connect+handshake+native-tls) + `futures-util` 추가.

**Live verification (30s YouTube 영어 강연)**:
- ✅ Overlay placeholder ("Awaiting English audio.") → 실시간 영어 자막 자연 흐름
- ✅ Partial → final 전환 자연 (Soniox endpoint detection 의 1-3초 단위 commit cadence — 의미 보존 우선, default 유지)
- ✅ Capture stats: peak -29.3 dBFS / 1395b sys / 6 segments / 104.3KB / **drift 0.00ms** / **peak RSS 128MB** (Day 5 capture-only 1h 의 135MB 와 동등 — STT 통합으로 메모리 폭증 X, budget 200MB 의 64%)
- ✅ Mic 0 (예상대로 deferred)
- ✅ Stop capture → STT thread + bridge thread 깔끔 join, "session ended" log
- ✅ 27 unit tests pass (23 기존 + 4 신규 resample)

**Day 15a scope (의도적 제외 — Day 15b 행)**:
- Reconnect 로직 (1→2→4→8→max 30s exponential backoff)
- 30s ring buffer audio for reconnect resume (네트워크 blip 시 audio 누락 없이 재개)
- 1h dogfooding RSS verification (peak < 200MB budget 긴 시청 검증)
- Wi-Fi 토글 simulate 후 자동 복구 verify
- Settings UI BYOK key surface (§16, Phase 2 polish)
- Production-grade resampler (rubato/samplerate anti-aliased, Phase 2 dep audit)

**Spike → repo 재구현 시 발견**:
- Partial 누적 버그가 spike 에서는 안 드러남 (raw stdout 만 출력) — Tauri 통합 후 Overlay 가 visible 해지면서 즉시 드러남 (사용자: "엄청나게 많은 글이 쓰이는 문제"). Per-message reset 으로 수정.
- Soniox v4 의 commit cadence (~1-3초 endpoint boundary) 가 watch mode 의 follow-along reader 경험에 적합 — 빠른 commit 보다 의미 단위 우선 (사용자 결정).

### Day 16a 결과 (Solar Pro 3 한국어 번역 — wedge 완성 ✅)

**Wedge "Korean ears for English audio" 의 마지막 layer.** 영어 STT final → Solar Pro 3 EN→KO 번역 → Overlay 에 영어/한국어 두 줄 caption 라이브 동작.

**구조 (3 파일 신규/수정)**:
- `src-tauri/src/translate/mod.rs` — `TranslatorSession` (own thread + own current_thread tokio runtime, STT mirror). `start(api_key, app)` returns `(UnboundedSender<String>, TranslatorSession)`. Sequential consumer (depth=1) — 매 final 마다 `upstage::translate_and_emit` 호출, 다음 final 처리 전에 완료까지 await. 순서 보존 by design (no seq machinery 필요).
- `src-tauri/src/translate/upstage.rs` — `translate_and_emit(client, key, app, en)` — POST `https://api.upstage.ai/v1/chat/completions` + model=`solar-pro3`. System prompt: "translate English speech to natural Korean, output only the Korean, preserve register/tone, keep technical terms when no clean Korean equivalent". 15s timeout. `translation_final` (`{original, translation}`) 또는 `translation_error` event emit.
- `src-tauri/src/stt/{mod,soniox}.rs` — `final_tx: Option<UnboundedSender<String>>` 파라미터 추가. Reader task 가 stt_final emit 직전 same text 를 final_tx 로 forward. Korean detection (token language=`ko`) 시 번역 skip — already-Korean 발화 (사용자 mixed 발화) 는 그대로 통과.
- `src-tauri/src/lib.rs` — `spawn_capture` 가 `UPSTAGE_API_KEY` env present 시 translator 먼저 start, sender 를 STT 에 hand. `CaptureSession.translator` 추가, `stop_capture` 가 의존순 (capture → STT → translator) join.
- `src/App.tsx` Overlay — `translation_final` / `translation_error` 2개 listener 추가. 새 layout: 영어 (작은 11px / 회색 0.55) 위, 한국어 (큰 14px / 검정 0.92) 아래 — Korean 이 primary value layer. PLAN.md "KO only default + EN ⌥-toggle" 은 Day 16b polish.
- `src-tauri/Cargo.toml` — `reqwest = { version="0.12", default-features=false, features=["json","native-tls","http2"] }`.

**Provider pivot — OpenRouter → Upstage 직접**:
- 처음 OpenRouter 의 `upstage/solar-pro-3` 시도 → **401 Unauthorized**: `"API key suspended due to insufficient credit. Register your payment method at console.upstage.ai/billing"`. 메타데이터의 `is_byok: false` 가 OpenRouter 의 자체 (pooled) Upstage 계정 잔액 고갈을 가리킴. 우리 OpenRouter $5 잔액 X, OpenRouter 의 외부 dependency 문제. ETA 없음.
- 해결: Upstage 직접 가입 + $20 free credit 받음. Endpoint = `api.upstage.ai/v1/chat/completions`, 모델명은 `solar-pro3` (OpenRouter 의 `upstage/solar-pro-3` 와 hyphen 위치 다름).
- 동일 가격 ($0.15/M in, $0.60/M out, $0.015/M cached input). Caching 이 system prompt 에 자동 적용 — 첫 호출 후 매 호출의 system prompt 부분이 10x 할인.
- 코드는 OpenRouter spec 그대로 (둘 다 OpenAI-compatible chat completions API). 변경: URL + 모델명 + env var 만.

**Live verification (영어 lecture)**:
- ✅ Overlay 영어 (작게 / 회색) + 한국어 (크게 / 검정) 두 줄 자연 흐름
- ✅ 한국어 latency: 영어 final commit 후 ~1-2초 안에 따라옴 (Solar Pro 3 짧은 phrase 응답 시간)
- ✅ 27 tests pass (회귀 X — 새 크레이트 추가만)
- ✅ Translator session 깔끔 종료 ("session ended" log)

**번역 sample (probe)**:
- "So today in San Francisco was the first Code with Claude event of 2026."
- → "오늘 샌프란시스코에서 2026년 첫 번째 Code with Claude 행사가 열렸습니다."
- 109 input (48 cached) / 20 output tokens, ~$0.00002.

**비용 (1시간 시청 추정)**:
- 600 finals × ~50 input + 30 output ≈ 30K in + 18K out = ~$0.015/h (caching 적용 시 ~$0.013/h)
- $20 credit = ~1300시간 시청. 사실상 dogfood 비용 0.

**Day 16a scope (의도적 제외 — Day 16b 행)**:
- Streaming 응답 (SSE) — 현재 non-streaming, 한 phrase 의 한국어가 한 번에 도착. partial 한국어는 §11 LiveCaption gallery 시 검토.
- 동시 처리 depth=8 + seq + Map<seq, TranslationState> + contiguous prefix render (PLAN.md L329-389) — sequential depth=1 이 wedge 검증에 충분. backpressure 발생 시 도입.
- 5s timeout EN fallback unblock — 단 phrase 가 5s 초과 시 UI 가 멈추는 issue. 실제 dogfood 시 빈도 측정 후.
- "(번역 보류)" badge — bounded queue overflow 시 표시. queue 도입 후.
- KO-only default + EN ⌥-toggle — UI polish.

**Phase 2 acceptance 의 wedge 1차 검증 — Day 16a 시점에서 모두 통과**:
- 영어 YouTube 시청 → 라이브 한국어 자막 ✅ (1h 검증은 Day 15b dogfood 시 측정)
- Peak RSS budget < 200MB ✅ (Day 15a 의 134MB)
- Drift 0 / capture 안정 ✅
- Reconnect + 1h sustained 는 Day 15b acceptance

### Day 16b 결과 (Solar Pro 3 streaming SSE — 한국어 토큰 단위 흐름 ✅)

Day 16a 의 wait-then-emit 패턴 → SSE streaming 으로 한국어가 토큰 단위로 흘러나옴. 사용자 피드백 "검은색이 좀 느리다" (Day 16a 의 1-3초 wait 후 한 번에 한국어 등장) 의 직접 해결.

**구조 (3 파일 수정)**:
- `src-tauri/src/translate/upstage.rs` — POST body 에 `"stream": true` + 응답을 `resp.bytes_stream()` 으로 받음. `\n\n`-delimited SSE event boundary 검출 (`find_event_boundary`), 각 event 의 `data: {...}` line 을 `serde_json::from_str::<StreamChunk>` 으로 파싱하여 `choices[0].delta.content` 누적. 매 token 마다 `translation_partial { original, translation }` emit. `data: [DONE]` 도착 시 또는 stream 종료 시 trim 후 `translation_final` emit. UTF-8 boundary 안전 — `bytes_stream()` chunk 가 한글 3바이트 경계 중간에 잘려도 buffer 에 누적되어 다음 chunk 도착 후 완전한 event 만 디코드 (`String::from_utf8_lossy` 가 항상 완전한 event 에 대해서만 호출됨).
- `src-tauri/src/translate/mod.rs` — Day 16b: streaming 으로 module doc 업데이트. `[translate] ready (model=solar-pro3, streaming, sequential depth=1)` 로그.
- `src-tauri/Cargo.toml` — `reqwest` features 에 `"stream"` 추가 (`bytes_stream()` 활성화).
- `src/App.tsx` — `koPartial` state 추가. `translation_partial` listener 가 `setKoPartial(event.payload.translation)` (전체 누적 텍스트 replace). `translation_final` 시 `koText` 누적 + `koPartial` clear. `translation_error` 시 `koPartial` clear. 렌더에서 `koText` (검정) 뒤에 `koPartial` (opacity 0.65) span 으로 이어붙임.

**SSE 형식 사전 검증** (curl probe, 코드 작성 전):
```
data: {"choices":[{"delta":{"role":"assistant"}}]}
data: {"choices":[{"delta":{"content":"빠른"}}]}
data: {"choices":[{"delta":{"content":" 갈색"}}]}
data: {"choices":[{"delta":{"content":" 여"}}]}
data: {"choices":[{"delta":{"content":"우가"}}]}
...
data: {"choices":[{"delta":{},"finish_reason":"stop"}]}
data: [DONE]
```
OpenAI-compatible spec 그대로 — Upstage 가 1대1 호환. "빠른 갈색 여우가 게으른 개 위로 뛰어올랐습니다." 한 문장이 14+ 토큰으로 분할되어 도착, 각 토큰 ~14-27ms 간격.

**Live verification (영어 lecture)**:
- ✅ Overlay 의 한국어 layer 가 토큰 단위로 점진적으로 등장 (Day 16a 의 한 번에 vs Day 16b 의 흐름)
- ✅ 한글 깨짐 없음 (UTF-8 boundary 처리 정상)
- ✅ Stream 종료 시 `koPartial` 이 `koText` 에 commit, opacity 전환 자연스러움
- ✅ `translation_partial` → `translation_final` 사이 race condition 없음 (final 시 explicit clear)
- ✅ stt session, translator session 깔끔 종료

**Timing 측정 (debug println, 후 제거)**:
- Request → response headers: 첫 호출 ~850ms (cold), 이후 ~335ms (system prompt cached)
- Headers → first byte chunk: ~0ms (즉시 streaming)
- First chunk → first partial emit: ~50-70ms (SSE 파싱)
- First partial → stream end: ~150-250ms (8-18 tokens 전송)
- 즉 영어 final 후 ~1초 안에 한국어 완전히 commit, partial 은 ~400ms 부터 보이기 시작

**Throttle 시도 + revert** (사용자 결정):
- 사용자 1차 피드백 "더 느려진거 같은데" + "점진적 흐름인데 우다다 생겨" — 토큰 14-27ms 간격이 cognitive 따라가기 어려움
- App.tsx 에 150ms `setTimeout` throttle (pending partial buffer + flush) 추가 시도
- 사용자 2차 피드백 "아까가 낫다 아까로 돌리고 넘어가자" — throttle 없는 raw 가 더 자연
- Throttle + timing logs 모두 revert. Day 16b 의 final state = raw streaming, no debounce.
- Future: 사용자가 dogfood 중 다시 issue 제기 시 §11 LiveCaption gallery 시점에 다시 검토 (typewriter pace, scroll smoothing 등 옵션).

**Day 16b scope (의도적 제외 — 추후 슬라이스)**:
- 동시 처리 depth=8 + seq + Map<seq, TranslationState> + contiguous prefix render (PLAN.md L329-389) — sequential depth=1 이 streaming 후에도 wedge 검증에 충분. backpressure 발생 시 도입.
- 5s timeout EN fallback unblock — 단 phrase 가 5s 초과 시 UI 가 멈추는 issue. 실제 dogfood 시 빈도 측정 후.
- KO-only default + EN ⌥-toggle — UI polish.
- Cumulative partial reset 처리 (현재 Solar Pro 3 가 보내는 delta 가 *append* 의미 — content 가 cumulative 가 아니라 incremental delta. spec 그대로 동작 확인됨.)

**다음 슬라이스 우선순위 (Day 17+)**:
- Day 15b: reconnect + 30s ring buffer + 1h dogfood RSS verification
- Phase 2 acceptance 측정 (영어 YouTube 1h 시청 → 한국어 자막 + reconnect simulate + RSS budget < 200MB)
- Phase 3 polish 또는 Phase 0 잔여 sections (§02 Typography, §11 LiveCaption, §16 Settings UI)

### Day 15b 결과 (STT reconnect + 30s ring buffer ✅ — code path)

Day 15a 의 happy-path 위에 resilience layer. 코드 / 단위 테스트 모두 통과, **1h dogfood 검증은 Day 17** 에서 사용자 직접 (Wi-Fi 토글 simulate + 영어 lecture 1시간 + RSS budget 측정).

**구조 (3 파일 — 1 신규 + 2 수정)**:
- `src-tauri/src/stt/ring.rs` (신규) — `AudioRing` (VecDeque<Vec<u8>>). 16kHz × 2 bytes × 30s = **960KB cap**. `push(chunk)` 시 capacity 초과면 oldest pop, 단 single oversized push 는 retain (empty 방지). `snapshot()` 으로 replay 용 clone. **6 unit tests** (empty / under cap / over cap eviction / oversized retention / realistic 60s capture pattern → ring 240~260 chunks).
- `src-tauri/src/stt/soniox.rs` — `run_session` signature 변경:
  - 기존: `(api_key: String, app: AppHandle, chunk_rx: UnboundedReceiver<Vec<u8>>, stop: Arc<AtomicBool>, final_tx: Option<...>) -> Result<()>`
  - 신규: `(api_key: &str, app: &AppHandle, chunk_rx: &mut UnboundedReceiver<Vec<u8>>, stop: &Arc<AtomicBool>, final_tx: Option<...>, ring: &Arc<Mutex<AudioRing>>) -> Result<SessionEnd>`
  - chunk_rx, stop, ring 을 reference 로 받아 reconnect loop 가 재호출 가능
  - Connect 직후 ring snapshot 을 binary frame 으로 send (replay) — 빈 ring 이면 noop, 30s 분량이면 ~250 chunk
  - 종료 사유 enum: `SessionEnd::Stopped` (stop 신호 또는 chunk_rx close) / `Finished` (server `finished:true`) / `Dropped(String)` (server close, recv err, send err)
- `src-tauri/src/stt/mod.rs`:
  - `pub mod ring;` 추가
  - Bridge 가 매 chunk 를 ring + chunk_tx 양쪽 push (clone 1번. 3840 bytes / chunk → alloc bounded)
  - `run_with_reconnect` 함수가 outer loop:
    ```
    loop {
        if stop { break; }
        match run_session(...).await {
            Stopped | Finished => break;
            Dropped(reason) | Err => {
                attempt++;
                if attempt > 10 { emit "aborted"; break; }
                emit "reconnecting (attempt N/10, wait Xs)";
                sleep_with_drain(backoff_secs).await;
            }
        }
    }
    ```
  - `backoff_seconds(attempt)` = `2^(attempt-1)` capped at 30 → 1, 2, 4, 8, 16, 30, 30, … (10 attempts ≈ 3.3min total recovery window)
  - `sleep_with_drain` = 200ms tick 으로 stop 감시 + chunk_rx drain (sleep 중 chunk 가 unbounded 쌓이지 않도록. ring 이 last 30s truth)
  - **1 unit test**: backoff_doubles_then_caps (attempt 1→1s, 2→2s, …, 6+→30s)

**State machine surface**:
- 정상: capture 시작 → connect → live caption
- 일시 단절: `stt_error { code: "reconnecting", message: "Connection lost (...). Retrying in Xs (attempt N/10)" }` emit. Overlay listener 가 우선순위로 surface (caption 중단). 다음 attempt 성공 시 ring 30s replay 후 live 재개.
- 영구 실패: 10 attempts 후 `stt_error { code: "aborted", message: "Reconnect cap reached..." }` emit. STT 종료 (capture 는 계속, 단 자막 X).

**테스트 결과**:
- ✅ `cargo test --lib` 33 pass (27 기존 + ring 5 + backoff 1) — 0.41s
- ✅ `cargo build` 깨끗
- ⏳ 1h dogfood RSS — Day 17 사용자 직접 (Wi-Fi 토글 simulate + lecture 시청 + RSS 측정)

**Day 15b scope (의도적 제외 — 추후)**:
- Overlay UI: `stt_error { code: "reconnecting" }` 받았을 때 caption 영역에 "재연결 중…" 명시. 현재는 `setSttError(message)` 로 italic surface — 충분. 더 풍부한 UI 는 §11 LiveCaption gallery 시점.
- 401/Auth 별도 처리: 현재는 모든 dropped 가 동일 backoff 로 retry. 401 은 첫 attempt 에서 server 가 error_message 보내면 그대로 retry (10번 까지). 실제 dogfood 시 빈도 측정 후.
- Ring 의 thread-safe 검토: std::sync::Mutex 사용, bridge 의 blocking task 와 reconnect loop 의 async task 가 serialize 됨. Lock contention 없음 (push/snapshot 모두 짧음).
- 실제 Wi-Fi 토글 / 30분 idle simulate 자동 테스트: integration test 어려워 skip. Day 17 empirical 만.

### 환경 (재현용)

- Bartleby repo: `~/Dev/side/bartleby/`
- Spike binary (참조 only, 코드 복사 금지): `~/Dev/_inbox/bartleby-spike/`
- macOS 26 (Tahoe), Rust 1.95, Tauri 2.x, Vite 7, React 19
- `.cargo/config.toml` (project root): rpath flag + PATH=/opt/homebrew/bin
- `src-tauri/Info.plist`: NSMicrophoneUsageDescription / NSScreenCaptureUsageDescription / NSCameraUsageDescription

### Day 18a 결과 (§16 Settings UI Tab 1 BYOK keys ✅ — code path)

Day 17 dogfood 진입 전 편의성 layer. ENV var 의존 제거 (유지는 dev fallback) — 사용자가 UI 에서 SONIOX/UPSTAGE 키 입력 + macOS Keychain 저장. 코드 / 단위 테스트 / build 통과. **사용자 직접 verify + dogfood 시 Keychain prompt 첫 1회 동의 필요** (unsigned dev binary 한계, `tauri build` 시 silent).

**구조 (5 신규 + 5 수정)**:
- `src-tauri/Cargo.toml` — `keyring = "3"` 추가 (3.6.3 resolved)
- `src-tauri/src/secrets.rs` (신규, ~60 lines) — `load(name)` / `save(name, value)` / `clear(name)` over `keyring::Entry::new("com.heybartleby.bartleby", name)`. `NoEntry` → `Ok(None)` mapping, clear idempotent. 1 ignored test (Keychain roundtrip, `cargo test -- --ignored` 로 로컬 검증).
- `src-tauri/src/stt/soniox.rs` — `verify_key(api_key)` async fn 추가. WS connect + config send + 1.5s timeout 동안 `error_message` frame 감지. 무응답 = OK (정상 키는 audio 도착까지 silent), `error_message` = invalid.
- `src-tauri/src/translate/upstage.rs` — `verify_key(api_key)` async fn 추가. `POST /v1/chat/completions` `max_tokens:1` `stream:false` ping. 200 OK / 401 invalid / others surfaced.
- `src-tauri/src/lib.rs`:
  - `pub mod secrets;` 등록
  - `resolve_key(name)` helper — Keychain 먼저, ENV fallback. 각 호출마다 source 로깅 (`[secrets] {name} resolved from Keychain|ENV`).
  - `spawn_capture` 의 `env::var` 직접 호출 → `resolve_key`.
  - 4 Tauri commands: `api_key_status` / `save_api_key` / `clear_api_key` / `verify_api_key`. `KeyStatus { present, source: "keychain"|"env"|null }`.
- `src/components/KeyInput.tsx` + `KeyInput.module.css` (신규, from-scratch, design-system §05 reference 만, 코드 복사 X) — masked password input, status badge (idle / verifying / verified / invalid), Verify / Save / Clear 버튼 3종, 한국어 helper text italic.
- `src/Settings.tsx` + `Settings.module.css` (신규) — modal sheet 720px max, header `Settings` + epigraph "Bartleby would prefer not to bother you.", 5 tabs (`Keys` 활성, `Modes`/`Storage`/`Shortcuts`/`About` disabled — slice 분할), Soniox/Upstage 두 KeyInput, footer "Both keys are stored in macOS Keychain. Bartleby never sees them outside this device.", Done 버튼 + backdrop click close.
- `src/App.tsx`:
  - `Settings` import + `settingsOpen` / `keysMissing` state
  - `refreshKeyStatus` (mount 시 + Settings 변경 시 호출) — 두 키 status 조회 → banner 토글
  - capture-hero 위 `.settings-gear` 버튼 (top-right ⚙)
  - hero 아래 first-launch banner "Add API keys to start →" (둘 다 missing 일 때만)
  - `<Settings>` 조건부 렌더 (modal)
- `src/App.css` — `.settings-gear` (32px square ghost button), `.key-banner` (mono uppercase paper-2 bg) 추가.

**동작 흐름**:
1. 첫 launch → 키 모두 missing → main 에 "Add API keys to start →" banner + ⚙ gear icon
2. ⚙ 클릭 또는 banner 클릭 → Settings modal
3. Soniox 키 paste → Verify 클릭 → WS handshake 1.5s probe → ✓ verified 또는 invalid 메시지
4. Save 클릭 → Keychain 저장 (첫 저장 시 macOS prompt) → `Saved to Keychain. Restart capture to apply.` 메시지
5. Done 닫기 → banner 자동 사라짐 (refresh)
6. capture 시작 시 lib.rs::spawn_capture 가 Keychain 먼저 조회 → ENV fallback. 콘솔에 `[secrets] SONIOX_API_KEY resolved from Keychain` 출력.

**테스트 결과**:
- ✅ `cargo build` 깨끗 (keyring 3.6.3 새로 다운로드 후)
- ✅ `cargo test --lib` 33 pass + 1 ignored (Keychain roundtrip; 로컬에서 `--ignored` flag 로 검증 권장)
- ✅ `pnpm build` clean (TypeScript 통과, 484ms 빌드)
- ⏳ Live verify probe: 사용자가 dev mode 에서 실제 키로 verify 클릭 시 Soniox/Upstage 응답 확인 — 다음 dogfood 단계에서 자연 검증

**Day 18a scope (의도적 제외 — 후속 슬라이스)**:
- Tabs 2-5 (Modes / Storage / Shortcuts / About) — disabled chip 만, 각각 별도 slice 가치.
- KeyInput 의 verifying 동안 spinner 애니메이션 — 텍스트 "verifying…" 로 충분.
- Hot-swap (capture 중 키 교체 즉시 반영) — Save 메시지에 "Restart capture to apply." 안내. 슬라이스 분할 가치 낮음.
- 첫 Save 시 macOS Keychain prompt UX 개선 — unsigned binary 한계, `tauri build` 후 사라짐.
- Settings 진입을 단축키 (예: ⌘,) 로 — global-shortcut 권한 추가 필요, 별도 slice.

### Day 18b 결과 (§16 Settings UI Tabs 2-5 + Overlay wire ✅ — code path)

A1 chunk (큰 단위 묶음 — 사용자 cadence rule). 4 신규 tab + Settings 분할 + 공통 form primitives + Overlay 의 visible wire. dogfood 진행 X (다음 통합 dogfood 시점까지 보류). executor 위임으로 21 파일 +1245 lines 한 번에.

**구조 (분할 + 신규)**:

`src/settings/` (신규 디렉토리):
- `prefs.ts` — `Prefs` interface (caption_mode / overlay_opacity / caption_font_size / overlay_position / caption_pause_threshold_s / click_through_default / mic_source / bilingual_layout / auto_summarize / summary_language / save_path / audio_retention_days / update_channel) + `loadPrefs` / `savePrefs` (`localStorage` + `@tauri-apps/api/event::emit("prefs_changed")` 자동 broadcast) + `setPref` / `listenToPrefs`.
- `Settings.tsx` (이전 `src/Settings.tsx` 에서 이동 + 분할) — frame: backdrop + sheet + header + tab segmented + body + footer. `useState<TabId>` 로 5탭 routing.
- `KeysTab.tsx` — 이전 Settings.tsx 의 두 KeyInput 부분 추출.
- `ModesTab.tsx` — Watch (caption display segmented / opacity slider / font size segmented / position segmented / pause threshold input / click-through toggle) + Meeting (mic source disabled "Default" / bilingual layout segmented / auto-summarize toggle / summary language segmented). `setPref` on change.
- `StorageTab.tsx` — save path display + Choose... disabled / retention slider (1-90 days) wired / disk usage placeholder "—" / Open in Finder + Clean up disabled.
- `ShortcutsTab.tsx` — read-only 5 row table (⌘⌃B / ⌘⌃M / ⌘⇧V / ⌘⇧4 / ⌘Q) + Customize... disabled.
- `AboutTab.tsx` — v0.1.0 hardcoded + tagline + heybartleby.com / GitHub 링크 + Auto-update (Check now disabled) + update channel segmented (stored only) + License note + "Design with care from Seoul." Cormorant italic.
- 각 탭 `.module.css` — design tokens 만 사용.

`src/components/` (form primitives):
- `Toggle.tsx` + `.module.css` — boolean switch (paper bg, ink thumb, transition).
- `Segmented.tsx` + `.module.css` — generic `<T extends string>` option group, active = ink underline.
- `Slider.tsx` + `.module.css` — native `<input type="range">` + CSS `--pct` gradient fill + value display + unit suffix.

**Overlay wire (visible 즉시 반영)**:
- `App.tsx::Overlay` — `loadPrefs()` 로 mount 시 초기값 + `listenToPrefs(prefs => setStates)` 등록 (cleanup 포함, useEffect 분리).
- `caption_mode` → `showKo` / `showEn` 분기 (`ko` = 한국어만 / `ko_en` = 양쪽 / `en` = 영어만).
- `overlay_opacity` → `bgAlpha = opacity / 100` → outer div background `rgba(248, 247, 244, ${bgAlpha})`.
- `caption_font_size` → 한국어 layer 의 `fontSize` 직접 적용.
- `App.css :root` — `--overlay-bg-opacity: 0.85; --caption-size: 16px;` fallback CSS var (현재는 inline style 우선이지만 future migration 용).

**Storage-only 항목 (consumer infra 추후)**: overlay_position / caption_pause_threshold_s / click_through_default / bilingual_layout / auto_summarize / summary_language / save_path / audio_retention_days / update_channel.

**Disabled 항목 (다음 chunk)**: Tab 3 Choose... / Open in Finder / Clean up (tauri-plugin-dialog + tauri-plugin-fs 미설치). Tab 4 Customize... (global-shortcut dynamic re-register infra 미구현). Tab 5 Check now (auto-update infra).

**테스트 결과**:
- ✅ `cargo build` clean (Rust 변경 없음 sanity)
- ✅ `cargo test --lib` 33 pass + 1 ignored 유지
- ✅ `pnpm build` clean (TypeScript 통과, 423ms)

**Day 18b scope (의도적 제외 — 후속)**:
- `tauri-plugin-dialog` / `tauri-plugin-fs` 추가 — Choose... / Open in Finder / Clean up 활성화 chunk.
- mic enumeration Tauri command — `MicrophoneSink` 의 device 목록 + Tab 2 Meeting select 활성화.
- $TMPDIR walker Tauri command — Tab 3 disk usage 실수치 + Clean up confirm dialog.
- global-shortcut dynamic re-register — Tab 4 Customize... infra. lib.rs 의 setup hook 의 `on_shortcut` closure stable handler 필요.
- AboutTab version Vite env inject — `import.meta.env.PACKAGE_VERSION` 또는 build-time generation. 현재는 hardcode (사용자 cadence: 자잘 X).

### Day 19a 결과 (§02 Typography gallery ✅ — code path)

A2 chunk. Phase 0 gallery 의 두 번째 section. §00 Manifesto + §01 Color 다음. from-scratch (memory rule: external reference 코드 복사 금지, 패턴만 학습).

**구조 (3 파일 수정/신규)**:
- `src/gallery/sections/02-Typography.tsx` (신규, ~200 lines) — `Typography` 컴포넌트:
  - **DSSection wrapper** — `id="typography"`, `kicker="02 · Typography"`, `title="Four voices, one manuscript."`, lede (한국어+영어 mix tone, 4 폰트 요약)
  - **Font family specimens 4 row**: Pretendard (400/500/600/700), Gowun Batang (400/700), Cormorant Garamond (400 regular / 400 italic / 500 medium italic), JetBrains Mono / D2Coding (400/500). 각 row: 폰트명 + role 메타 왼쪽, weight variant stack 오른쪽.
  - **Type scale table** — `--t-xs` ~ `--t-5xl` 10 step. 3-col: token name / px + lh / 실제 "Bartleby" sample text. `.tabular` numeric, hairline rule 구분.
  - **Tracking comparison** — `--tracking-tight / -normal / -wide / -wider` 4종. "BARTLEBY" `.display` 28px × 4 rows. 토큰 label 왼쪽, sample 오른쪽.
  - **Font role grid** — 2-col grid. 4 cell (eyebrow + 한 줄 role 설명). `kr-leading` 적용.
  - TypeScript 인터페이스: `WeightSpec` (`italic?: boolean`) + `FontFamily`. 타입 안전 heterogeneous weight 배열.
- `src/gallery/Gallery.tsx` — `Typography` import + `<Typography />` render (ColorTokens 다음)
- `src/gallery/Gallery.module.css` — `/* ── Typography section ── */` 블록 추가:
  - `.type-families`, `.type-family-row` (grid 180px + 1fr), `.type-family-meta`, `.type-family-specimens`, `.type-specimen-item`
  - `.type-scale-table`, `.type-scale-row` (grid 120px + 100px + 1fr, hairline border)
  - `.type-tracking-rows`, `.type-tracking-item` (flex + align-items: baseline)
  - `.font-role-grid` (2-col grid), `.font-role-item`

**설계 결정**:
- kicker 포맷 = 기존 §00 / §01 패턴 (`"02 · Typography"`) 유지 — tagline title 로 literary 톤 (`"Four voices, one manuscript."`). spec 의 `"§02"` literal 보다 gallery reel 일관성 우선.
- CSS 를 `Gallery.module.css` 에 추가 — §00/§01 와 동일 파일. `02-Typography.module.css` 분할 시 첫 split 이므로 일관성 우선.
- 인라인 `style={{ ... }}` 에 `var(--token)` 사용 — §01 Color 의 기존 패턴과 동일. literal hex/rgba 금지 (design tokens only).
- Gowun Batang specimen: 한국어 전용 (`specimen_en: ""`). rendering 조건 분기로 빈 span 미생성.

**검증**:
- ✅ `pnpm build` (tsc + vite) — 0 TypeScript errors, 406ms. Gallery-*.css 3.69 kB.
- ✅ `cargo build --manifest-path src-tauri/Cargo.toml` — Finished dev (0.15s, no Rust changes)
- ✅ `cargo test --manifest-path src-tauri/Cargo.toml --lib` — 33 passed; 0 failed; 1 ignored (0.41s)
- ✅ Linear SIH-1186 "A2 §02 Typography gallery" — created + Done (https://linear.app/sihyun-dev/issue/SIH-1186/a2-02-typography-gallery)
- ✅ Commit `cc300b0`

**Day 19a scope (의도적 제외 — 후속)**:
- §03~§18 gallery sections — Phase 0 lazy fill. 각 section 별도 chunk.
- §02 Gowun Batang 로드 검증: woff2 번들 확인됨 (`gowun-batang-*.woff2` dist 에 포함), 실제 WebView 렌더링은 dogfood 시 visual verify.
- Cormorant Garamond italic: weight 500 italic + Tauri WebView `font-synthesis` 동작은 실제 렌더 시 verify.

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

### Step 3: Day 15a — Tauri 통합 (capture → STT → overlay caption) ✅ *완료*

자세한 결과는 위 "Day 15a 결과" 섹션 참조. happy-path 작동 (영어 YouTube → 라이브 자막), drift 0.00ms / peak RSS 128MB / 27 tests pass. Reconnect + ring buffer + 1h RSS 는 Day 15b.

### Step 3c: Day 16a — Solar Pro 3 한국어 번역 ✅ *완료*

자세한 결과는 위 "Day 16a 결과" 섹션 참조. Sequential depth=1, 영어 final → Solar Pro 3 → 한국어 caption. **Wedge "Korean ears for English audio" 완성**.

### Step 3d: Day 16b — Solar Pro 3 streaming SSE ✅ *완료*

자세한 결과는 위 "Day 16b 결과" 섹션 참조. `stream:true` + `bytes_stream` + `\n\n` event 파싱 + UTF-8 safe + `translation_partial` per token. 사용자 "더 느려진거 같다" → throttle 시도 후 revert (raw 가 자연). Sequential depth=1 유지.

### Step 3b: Day 15b — Reconnect + 30s ring buffer ✅ *완료 (코드 + 단위 테스트)*

자세한 결과는 위 "Day 15b 결과" 섹션 참조. `stt/ring.rs` 신규 + `soniox::run_session` reconnect-friendly signature + `stt::run_with_reconnect` 의 exponential backoff loop. 33 tests pass. **1h dogfood 검증은 Day 17** (사용자 직접 — Wi-Fi 토글 simulate + lecture 1h 시청 + RSS budget 측정).

### Step 3f: Day 18a + 18b — §16 Settings UI 5 tabs + Overlay wire ✅ *완료 (코드)*

자세한 결과는 위 "Day 18a 결과" / "Day 18b 결과" 섹션 참조. **Day 18a** = Tab 1 Keys (Keychain + verify probe). **Day 18b** = Tabs 2-5 (Modes / Storage / Shortcuts / About) + 공통 form primitives (Toggle/Segmented/Slider) + Overlay listen `prefs_changed` (caption_mode KO/KO+EN/EN, overlay_opacity, caption_font_size 즉시 반영). Storage-only / Disabled 항목 명시. 33 tests pass + 1 ignored, pnpm/cargo build clean. **다음 chunk 추천**: A2 §02 Typography gallery 또는 A5 §15 Mode Switch UI (Watch ↔ Meeting 토글). 통합 dogfood 는 chunk B (미팅 모드 UI) 후 한 번에.

### Step 3e: Day 17 — Phase 2 acceptance (empirical) ← *현재 슬라이스 (사용자 직접 dogfood)*

Day 15a happy-path + Day 15b 의 resilience layer 를 1h 영어 YouTube 시청으로 검증. **코드는 이미 모두 ready** (Day 15b 의 reconnect + ring buffer + Day 5 의 RSS sampler + capture stats). 이번 단계는 **사용자가 직접 dogfood + 측정값 기록** 만 남음.

#### A. 코드 상태 (recap — 추가 구현 필요 X)

| 컴포넌트 | 상태 | 위치 |
|---|---|---|
| Reconnect loop (1→2→4→8→16→30s, cap 10) | ✅ Day 15b | `stt/mod.rs::run_with_reconnect` |
| 30s ring buffer (960KB cap, replay on connect) | ✅ Day 15b | `stt/ring.rs::AudioRing` |
| State surface (`stt_error { code: "reconnecting" \| "aborted" }`) | ✅ Day 15b | `stt/mod.rs` emit + `App.tsx` listener |
| RSS sampler (5s 간격 CSV → `$TMPDIR/bartleby-rss-{ts}.log`) | ✅ Day 5 | `capture/rss.rs` |
| CaptureStats (peak_rss_mb, mean_rss_mb, drift_ms, segments, peak_dbfs) | ✅ Day 5/9 | `capture/system_audio.rs` |
| 33 unit tests (ring 6 + backoff 1 + 기존 27) | ✅ Day 15b | `cargo test --lib` |

#### B. Pre-flight checklist (dogfood 시작 전)

```bash
# 1. 환경변수 (current shell 또는 .envrc)
source ~/.config/secrets/soniox.env       # SONIOX_API_KEY
source ~/.config/secrets/upstage.env       # UPSTAGE_API_KEY

# 2. dev build 시작 (warm-up ~10s)
cd ~/Dev/side/bartleby
pnpm tauri dev

# 3. 별도 터미널에서 RSS log 실시간 tail (선택)
ls -t $TMPDIR/bartleby-rss-*.log | head -1 | xargs tail -f
```

체크리스트:
- [ ] `SONIOX_API_KEY` / `UPSTAGE_API_KEY` 로드 확인 (앱 시작 시 콘솔에 `[stt] ready` / `[translate] ready` 출력)
- [ ] Bartleby 앱 윈도우 떴고 overlay 도 fullScreenAuxiliary 위에 floating
- [ ] 영어 YouTube 영상 선택 (~60min 강연 — TED, MIT OCW, Lex Fridman 등 권장)
- [ ] 노트북 power adapter 연결 (1h sleep 방지)
- [ ] Bluetooth 헤드셋 미사용 (system audio capture 안정성 위해 내장 스피커)

#### C. Run-time monitoring (1h 동안 봐야 할 것)

**콘솔 로그 (정상 케이스)**:
- `[capture] sys: Nb / Nf / X.Xs` — 5s 마다 segment 통계
- `[stt] partial: …` / `[stt] final: …` — 자막 token 흐름
- `[translate] partial: …` / `[translate] final: …` — 한국어 번역 token 흐름
- `[rss] elapsed=Xs rss=YMB` — 5s 마다 RSS 샘플

**경고 신호 (관찰값 기록)**:
- `[stt] dropped (reason). reconnect attempt N in Xs` — reconnect 발생 (Wi-Fi blip 또는 서버 close). attempt 번호 + 사유 기록.
- `[stt] aborted: reconnect cap reached` — 10번 실패 후 give up (실제 dogfood 에선 안 일어나야 함)
- Overlay 의 italic "STT: Reconnecting…" 표시 — 그 동안 자막 끊김. 복구 시간 측정.
- RSS 가 200MB 초과 — capture 즉시 종료 후 leak 분석

#### D. Edge case simulate 절차 (선택 — 1h dogfood 와 별도 세션 권장)

**D1. Wi-Fi 짧은 토글 (~5s)**
1. dogfood 중간 (예: 30분 시점) Wi-Fi 끄기 (메뉴바 → off)
2. 5초 대기 (Soniox WS 가 send/recv error 로 drop 감지)
3. Wi-Fi 다시 on
4. **기대**: ring buffer 의 30s replay 후 live 자막 재개. attempt=1 → 1s backoff → connect 성공.
5. 기록: `reconnect_count`, 자막 끊긴 시간 (체감 / 콘솔 timestamps)

**D2. 잘못된 SONIOX_API_KEY**
1. `SONIOX_API_KEY=invalid_key pnpm tauri dev` 로 시작
2. capture 시작 → 첫 connect 시 401 / auth fail
3. **기대**: 10 attempts 모두 실패 (1+2+4+8+16+30+30+30+30+30 = 181s 후 abort) → overlay 가 "STT: Reconnect cap reached…" 표시
4. 실제 측정: 첫 attempt 까지 latency, 마지막 abort 까지 시간

**D3. 30분 idle disconnect (선택, 별도 세션)**
- Soniox 의 server-side idle timeout 빈도 미상. 1h dogfood 중 자연스럽게 일어나면 D1 와 동일한 복구 거동 확인. 별도 simulate 어렵움.

#### E. Post-run 측정 form (1h dogfood 종료 후 채우기)

```
실시 일시:           YYYY-MM-DD HH:MM ~ HH:MM
영상:                <URL or 제목>
실제 capture 시간:   {seconds}s (목표 3600±10s)

[Capture stats]
- drift_ms (final):  ___ms (목표 < 100ms)
- system segments:   ___개 (목표 ~720, 5s × 720)
- system total:      ___MB (목표 ~14MB compressed)
- peak_dbfs:         ___dBFS (영어 음성이면 -10 ~ -30 범위)
- mic segments:      ___개 (deferred 이므로 0 예상)

[RSS 측정]
- peak_rss_mb:       ___MB (목표 < 200MB, Day 5 capture-only baseline 135MB + STT/translate 여유)
- mean_rss_mb:       ___MB
- 1h 동안 trajectory: 시작 ___MB → 30분 ___MB → 종료 ___MB (leak 검증, 1h 증가량 < 10MB 권장)

[STT 안정성]
- reconnect 발생 횟수:    ___번 (자연 발생, 0 = 안정)
- reconnect 평균 복구:    ___초 (감지 → live 재개)
- 자막 누락 구간 timestamps: [hh:mm:ss ~ hh:mm:ss, ...]
- 체감 평균 latency:      audio → 영어 final caption ___초 / 영어 → 한국어 partial 첫 토큰 ___초

[번역 품질 (sample 5문장)]
1. EN: "..."
   KO: "..."
   판정: ✅/⚠️ (의미 정확 / 자연스러움)
2. ...

[Edge case simulate]
- D1 Wi-Fi 5s 토글:   ✅/❌ — ring replay 작동, 자막 _____ 초만에 재개
- D2 invalid key:     ✅/❌ — 10 attempts 후 ___초 만에 abort, overlay error 표시 명확
- D3 30분 idle:       (관찰 안됨 / 자연 발생 → 동일 거동)

[GO/NO-GO]
- peak_rss < 200MB:                      ✅/❌
- drift < 100ms:                         ✅/❌
- 1h 자막 끊김 < 10s 누적:                ✅/❌
- Wi-Fi blip 자동 복구:                   ✅/❌
- bad-key abort surface:                 ✅/❌

→ 5/5 → Phase 2 acceptance ✅. wedge 1차 검증 완료. Phase 3 polish 진입.
→ 4/5 이하 → 어느 항목 fail 인지 + 다음 슬라이스 정의 (예: leak 발견 시 heap profiling).
```

#### F. 측정 후 commit 절차

1. 측정 form 채워서 NEXT.md 의 "Day 17 결과" 섹션 신규 작성 (Day 15b/16b 결과 섹션 패턴 따라)
2. 누적 commits 표에 `Day 17 acceptance ✅ — 1h dogfood (peak RSS XXX MB, reconnect N, ...)` row 추가
3. Risk Watch 의 "STT reconnect / ring buffer" row 를 ✅ empirical 로 업그레이드
4. PRINCIPLES / VISION 의 "wedge 1차 검증" 마일스톤 (있다면) 갱신
5. `git add -p NEXT.md && git commit` (코드 변경 없음, NEXT.md 만)

### Step 4: Day 16+ — Solar Pro 3 KO translation pipeline

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

## Future inspiration (post-wedge, 진입 시점 명시)

- **autopreso** (`kunchenguid/autopreso`, npm) — *"Realtime speech to presentation. Let the whiteboard whiteboard itself."* 발화 → STT → LLM → Excalidraw canvas 위 자동 도형/라벨/배치. 알파, OpenAI BYOK 또는 Moonshine+Ollama 로컬.
  - **Bartleby 와의 핏**: 미팅 모드 (mic+system, dual stream) 와 평행. "사용자 발화 architecture talk → 자동 다이어그램" 시나리오. text-only 미팅 노트 (Granola/Otter) 대비 차별 layer 후보. Bartleby brand voice ("글 옮겨드립니다 → 도형도") 결 일치.
  - **진입 시점**: **Phase 2 wedge 검증 (Day 17 dogfood) ✅ + Phase 4 미팅 모드 본진 production 작동 ✅ 후**. wedge 검증 *전* 에 visual layer 얹으면 검증 흐려짐.
  - **첫 발걸음**: Day 14 STT spike 패턴 — throwaway repo 1주, 한국어 발화 → LLM tool calling → tldraw/Excalidraw 도형 정확도/비용/지연 측정. Pass → Bartleby 미팅 모드 위에 from-scratch 통합. Fail → 회의 후 1회 generation fallback 또는 drop.
  - **차별점 (autopreso 단순 추종 X)**: Bartleby 의 한국어 + transcript context + 미팅노트 통합 = 다른 wedge.
  - **Read-only 룰**: Anarlog 와 동일, 패턴만 학습 코드 복사 X.

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
| Tauri STT 통합 (capture → 자막) | ✅ Day 15a 통과 | src-tauri/src/stt/ + capture fan-out + Overlay listener. 영어 YouTube 30s 라이브 자막 흐름, drift 0.00ms / peak RSS 128MB (capture-only 와 동등), 27 tests pass. Reconnect + 1h RSS 는 Day 15b. |
| Solar Pro 3 한국어 번역 (wedge 완성) | ✅ Day 16a 통과 | src-tauri/src/translate/ — Upstage 직접 API (OpenRouter pool 차단 우회) + sequential depth=1. 영어 final → Solar Pro 3 → 한국어 caption ~1-2초 lag. $20 credit (free) = ~1300h 시청. 비용 ~$0.015/h. |
| 한국어 streaming (token-level partial) | ✅ Day 16b 통과 | translate/upstage.rs `stream:true` + bytes_stream + `\n\n` event boundary + UTF-8 safe. `translation_partial` per delta token, `translation_final` on `[DONE]`. Frontend `koPartial` opacity 0.65 partial. Sequential depth=1 유지. |
| STT reconnect / ring buffer | ✅ Day 15b 통과 (code) | stt/ring.rs (960KB cap, 6 tests) + soniox::run_session reconnect-aware signature + stt::run_with_reconnect 의 exponential backoff (1→2→4→8→16→30s, cap 10 attempts). Bridge 가 ring + chunk_tx 양쪽 push, sleep 중 chunk_rx drain. 33 tests pass. **1h empirical (Wi-Fi 토글 + lecture + RSS) 는 Day 17 사용자 직접.** |
| 번역 backpressure / order preservation | ⏳ deferred | 동시 depth=8 + seq + Map<seq, TranslationState> + contiguous prefix render + 5s timeout EN fallback. 현재 sequential depth=1 + streaming 으로 자연 lecture 시청 충분. backpressure 실제 발생 시 도입. |
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

# 단위 테스트 (33개 — planar 3 + drift 4 + opus 4 + rss 1 + silence 11 + STT 4 + ring 5 + backoff 1)
cargo test --manifest-path src-tauri/Cargo.toml --lib

# Day 17 dogfood: RSS log 실시간 tail (가장 최근 capture 세션)
ls -t $TMPDIR/bartleby-rss-*.log | head -1 | xargs tail -f

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

> "Bartleby floats, moves, listens, surfaces silence, answers to ⌘⇧B, wears his own colors, hears Korean and English at production quality, streams live Korean translations token-by-token of any English video, reconnects through Wi-Fi blips with 30s of replay buffer, **and now wears all five Settings tabs (Keys/Modes/Storage/Shortcuts/About) with caption mode + overlay opacity + font size that flow live to the overlay**. dogfood 는 chunk B (미팅 모드 UI 본진) 후 한 번에 통합."
