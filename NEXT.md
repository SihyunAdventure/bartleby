# Bartleby — Next Session Continuation

> 다음 세션에서 이 파일부터 읽고 진행.
> 마지막 세션: 2026-05-07 ~ 2026-05-08 — **Day 1-4 capture stack ✅ live verified**

---

## 현재 상태 (Day 4 종료, 2026-05-08 새벽)

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

### 작동 검증된 것

- `pnpm tauri dev` → "Bartleby" 윈도우 + Rust IPC ↔ React frontend round-trip
- System audio 캡처 — 10초 → 500 buffers / 480000 frames / 39.6KB Opus / 2 segments
- Opus encoder pipeline — mpsc channel + worker thread + rolling 5s segments, sample drop 0
- 메모리 bounded — Opus encoder flush 마다 disk 로 비움. 1h 캡처 수학적 가능 (~14MB).
- Drift 측정 helper — testable, 4 unit tests (perfect_sync / constant_offset / growing / empty)
- LC_RPATH `/usr/lib/swift` linker flag (Swift runtime ABI lib 위치)
- libopus 1.6.1 brew + audiopus_sys pkg-config 빌드 환경

### 작동 *안* 검증된 것 (의도적 deferred)

- **Mic 실 캡처** — Day 3 코드 + Info.plist 모두 들어가 있으나 dev mode 의 unsigned binary 에서 Apple SC daemon (`replayd`) 가 `with_captures_microphone(true)` 를 silently 무효화 (`micEnabled=0`). TCC 자체는 통과 (ffmpeg/AVFoundation 으로 cmux mic 정상 녹음 확인됨). SCStream mic feature 만 별도 enforcement. Apple Dev ID + `tauri build` 의 `.app` bundle (Hardened Runtime + signed) 시점에 풀릴 것으로 예측. PLAN.md L146 stance 와 일치.

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

### Step 1: ⭐ 1h system-audio stability + RSS profile (Day 5)

> PLAN.md 의 핵심 capture acceptance 미해결 항목. Opus 들어간 *지금* 가능.

**목표**: 60분 연속 system-audio 캡처 → 720 segment / RSS peak < 800MB / sample drop 0.

**slice scope**:
- Capture button 의 duration 을 UI 입력으로 받게 변경 (현재 hard-coded 10s)
- Capture 동안 5s 마다 process RSS 측정 → 로그 파일 (`/tmp/bartleby-rss-{ts}.log`)
- 60분 capture 의 peak RSS 가 800MB 미만이어야 ✅
- segment 파일 720개 (5s × 720 = 3600s = 60min) 생성 + 각각 audible

**slice 시작 점**:
- `src-tauri/src/lib.rs` 의 `capture_system_audio(seconds: u64)` 명령에 RSS sampling 추가
- 또는 별도 thread 가 `proc/self/status` 또는 macOS API 로 RSS 폴링
- macOS RSS: `task_info(mach_task_self(), TASK_BASIC_INFO, ...)` (libc) 또는 `ps -o rss= -p $$` shell out
- Frontend 에서 duration 입력 input 추가 (number, min=10 max=3600 default=10)

⚠️ Risk:
- 시청 동안 사용자가 60분 대기 (Lane B 인프라 진행 가능 시점)
- macOS sleep / wake 가 capture 중에 일어나면 어떻게 될지 unknown — 한 번은 sleep 안 하게 cmd 실행 또는 caffeinate

### Step 2: Two-window + tauri-plugin-nspanel (Day 5 또는 Day 6)

`pnpm tauri add nspanel` 또는 `cargo add tauri-plugin-nspanel`. main window + 작은 floating overlay (NSPanel) 2개 띄우고 drag/resize/opacity 검증. PRINCIPLES + design-system-extensions/overlay.md 의 spec 가능성 판단. 별도 슬라이스.

### Step 3: DRM detection PoC (Day 6 또는 Day 7)

Apple TV+ / Netflix 같은 DRM 콘텐츠 재생 중 system audio 가 silent (RMS < -60dBFS) 인지 10-20s 동안 측정해서 DRM-blocked 상태 detect. UI 에 "Bartleby would prefer not to. (DRM blocked)" 표시. 작은 슬라이스.

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
| 1h stability + RSS | ⏳ 다음 슬라이스 | Opus pipeline 메모리 bounded, 검증만 |
| Mic 실 캡처 | ⏳ Apple Dev ID 후 | Info.plist + code path 다 들어감, signing 만 남음 |
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

# 단위 테스트 (11개 — planar 3 + drift 4 + opus 4)
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

> "Bartleby has listened, encoded, and timestamped. Bartleby would prefer to listen for an hour next."
