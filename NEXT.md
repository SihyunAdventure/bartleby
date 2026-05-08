# Bartleby — Next Session Continuation

> 다음 세션에서 이 파일부터 읽고 진행.
> 마지막 세션: 2026-05-08 새벽 — **Day 1-6 ✅ + Day 7 partial (drag 3가지 시도 실패, hypothesis 만 남음)**

---

## 현재 상태 (Day 7 partial 종료, 2026-05-08 새벽 ~4:00)

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

#### 남은 항목 — Drag (Day 7 partial 후속)

3가지 시도 모두 실패. **이건 단순 1줄 fix 가 아니다** (advisor 의 1줄 fix 추측은 evidence 로 falsified):

| 시도 | 결과 | Note |
|---|---|---|
| `WebkitAppRegion: "drag"` (CSS) | ❌ | NSPanel 이 webview 의 -webkit-app-region 가로챔 |
| `panel.set_movable_by_window_background(true)` (Rust) | ❌ | webview = NSPanel 의 contentView 전체 → window background 영역 자체 없음 → 적용 의미 없음 |
| `getCurrentWebviewWindow().startDragging()` (JS onMouseDown) | ❌ | mouse event 는 webview 도달 (스크롤 작동 확인됨) — 그러나 startDragging 자체가 NSPanel 환경에서 silently no-op 또는 `nonactivating_panel` style 차단 |

**현재 코드 상태**: lib.rs 의 `set_movable_by_window_background` 제거됨, App.tsx 의 onMouseDown→startDragging 만 남음 (chrome button 패턴의 self-document 가치 + drag 시도 evidence).

**가설** (확인되지 않은 — *probe 순서대로 검증할 것*):
- ① `nonactivating_panel` style mask + Accessory 조합이 mouse focus / drag action 을 무효화
- ② nspanel 자체의 알려진 issue / gap (examples 어디에도 drag 검증 없음 — signal)
- ③ `is_floating_panel: true` config 가 drag 와 conflict

#### 다음 세션 Drag probe 순서 (cheapness 순)

**Probe 1 (5분, cheap discriminator)** — `nonactivating_panel` 임시 제거 후 retest

`src-tauri/src/lib.rs` setup 의 `panel.set_style_mask(StyleMask::empty().nonactivating_panel().into())` 를 임시로 `panel.set_style_mask(StyleMask::empty().into())` 또는 line 자체 제거. tauri dev 재시작 + drag 시도. 결과:
- 작동 → ① 가설 확정. 진짜 design tradeoff (drag vs. nonactivating). 사용자 결정 필요.
- 안 작동 → ① 가설 falsified. Probe 2/3 로.

**Probe 2 (5분)** — nspanel issues 검색

```bash
gh search issues --repo ahkohd/tauri-nspanel "drag" --json number,title,state
gh search issues --repo ahkohd/tauri-nspanel "movable" --json number,title,state
gh search issues --repo ahkohd/tauri-nspanel "startDragging" --json number,title,state
```

같은 이슈가 등록되어 있는지. 해결책 또는 known limitation 인지.

**Probe 3 (30분)** — minimal isolated app 으로 재현

새 throwaway tauri 2 + nspanel 프로젝트 만들고 같은 config (Accessory + nonactivating + transparent + alwaysOnTop) 로 drag 작동하는지 — 우리 코드 issue vs. nspanel issue isolation. 작동하면 우리 환경이 problem (Bartleby 의 다른 build flag 또는 plugin), 작동 안 하면 nspanel 의 fundamental gap.

#### Main 윈도우 띄우기 — Phase 0+ 별도

Accessory 채택 trade-off — dock icon 없어 main 안 보임. 의도대로. 다음 슬라이스:
- Menu bar item (NSStatusItem) 또는 hot key 로 main 호출
- ⌘W 로 main close, overlay 만 유지
- Phase 0 의 mode-switch (시청 ↔ 미팅) 와 묶기

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

### Step 1: Drag triage — 3 probes (Day 7 후속)

위 "남은 항목 — Drag" 섹션의 **Probe 1 → Probe 2 → Probe 3** 순서로 cheap discriminator 부터. Probe 1 이 5분이면 끝, 작동 시 진짜 design tradeoff 만 결정. 작동 안 하면 Probe 2/3 로 가설 narrow.

### Step 2: Main 윈도우 띄우기 (Phase 0 일부)

Accessory tradeoff 처리:
- Menu bar item (NSStatusItem) 또는 ⌘⇧B 같은 hot key 로 main window show
- 시청 ↔ 미팅 mode-switch 와 묶기 (design-system-extensions/mode-switch.md)

### Step 3 (이전): Two-window + tauri-plugin-nspanel — *완료* (Day 6 ✅)

`pnpm tauri add nspanel` 또는 `cargo add tauri-plugin-nspanel`. main window + 작은 floating overlay (NSPanel) 2개 띄우고 drag/resize/opacity 검증. PRINCIPLES + design-system-extensions/overlay.md 의 spec 가능성 판단. 별도 슬라이스.

### Step 2: DRM detection PoC (Day 7)

Apple TV+ / Netflix 같은 DRM 콘텐츠 재생 중 system audio 가 silent (RMS < -60dBFS) 인지 10-20s 동안 측정해서 DRM-blocked 상태 detect. UI 에 "Bartleby would prefer not to. (DRM blocked)" 표시. 작은 슬라이스.

### Step 3: Lane B 인프라 (사용자 직접, ~1시간)

- [ ] heybartleby.com 결제 (Cloudflare 또는 Porkbun)
- [ ] GitHub org `heybartleby` + repo bartleby (private)
- [ ] Twitter/X `@heybartleby` 핸들 선점
- [ ] Soniox 가입 → API key (`~/.config/secrets/soniox.env`)
- [ ] OpenRouter 가입 → API key + $5 충전
- [ ] **Apple Developer 신청 ($99/년, 승인 1주)** ← Day 3 mic empirical 의 prerequisite

### Step 4: 디자인 시스템 코드 구축 (Phase 0 본진)

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
| Overlay drag | ⏳ Day 7 partial — 3가지 시도 실패 | 1줄 fix 가설 falsified. Probe 1 (nonactivating 제거) 부터 다음 세션 |
| Main 윈도우 호출 (Accessory tradeoff) | ⏳ Phase 0 | menu bar item 또는 hot key |
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

# 단위 테스트 (12개 — planar 3 + drift 4 + opus 4 + rss 1)
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

> "Bartleby floats but does not move. Bartleby would prefer a daylight probe."
