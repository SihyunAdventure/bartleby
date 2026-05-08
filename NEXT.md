# Bartleby — Next Session Continuation

> 다음 세션에서 이 파일부터 읽고 진행.
> 마지막 세션: 2026-05-08 오전 — **Day 1-10 ✅ (drag + tray + silence detection + overlay event)**

---

## 현재 상태 (Day 10 ✅ 종료, 2026-05-08 오전)

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

### Step 1: Day 11 — Hot key (⌘⇧B) global summon (Day 8 후속)

`tauri-plugin-global-shortcut` 으로 ⌘⇧B 토글 (main hide ↔ show). discovery 는 menu bar 보다 떨어지지만 power user 가성비 좋음. Phase 0 의 mode-switch 와 묶일 수 있음.

### Step 2: Day 12 — Auto-capture lifecycle (시청 모드 entry)

지금까지는 main 윈도우 "Capture Ns" 버튼이 트리거. 실제 product 에서는 시청 모드 진입 시 자동 시작 / 종료. 스코프:
- "Watch mode" toggle (overlay 띄우기 + capture 자동 시작) vs. capture 일시정지
- mode-switch.md spec 참조
- 캡처 lifecycle 을 Tauri command set 으로 (start_capture / stop_capture / pause_capture)
- 현재 `capture_dual_to_opus` 는 fixed-duration blocking — 변경 필요 (start/stop signal 받게)

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

> "Bartleby floats, moves, lives in the menu bar, listens for silence, and tells the overlay so. Bartleby reserves the refusal line for the day mic confirms the DRM."
