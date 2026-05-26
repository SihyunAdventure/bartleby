# Bartleby — Execution Plan

- 시작: 2026-05-07
- Solo dev: 김시현
- v1 acceptance: Live recording 노트 dogfood 안정화 + waitlist 100+
- 2026-05-26 update: v0.1.1 public beta shipped. Next private-beta lane is Notique-hosted API relay on existing AWS EC2 so friends can use Bartleby without creating Soniox/Upstage accounts.

---

## 제품 정의 (2026-05-12 기준)

단일 dock Finder-like note taker. 단일 기능:

1. **Live recording 노트** (구현됨) — mic + system audio → 실시간 KO transcript → 종료 후 한국어 요약 노트. Library 에 영구 보관.

framing: "Korean ears for English meetings." 출력 경로 — Read / Skim / Listen (TTS 옵션, Phase 6).

---

## Sibling product — Rehear

YouTube URL → 한국어 더빙 pipeline 은 별개 sibling product Rehear 로 분리됐다
(`~/Dev/side/rehear/`). Rehear 가 Bartleby 의 capture/STT/translate/summary
코드를 fork 해서 시작했으며, 향후 양방향 evolution. 본 PLAN.md 는 Bartleby
(미팅 노트) 만 다룬다.

---

## Phase 1 — Capture Spike + Tauri Scaffold ✅

**기간**: Day 1-4 (2026-05-07)

**완료 내용**:
- ScreenCaptureKit Rust crate (`screencapturekit` v2.0, svtlabs) 로 system audio 60초 캡처 검증 ✅
- 검증 수치: 3000 buffers @ 48kHz, 60s, 99.9% non-zero, peak -18.41 dBFS, RMS -33.26 dBFS
- Tauri 2.0 + React + TS 스캐폴드 생성 ✅
- macOS 26 (Tahoe) / Xcode 26 / Rust 1.95 호환 확인 ✅
- macOS Swift runtime 링크 이슈 해결 (`-Wl,-rpath,/usr/lib/swift`) ✅
- Ad-hoc codesign 필수 조건 확인 ✅

**핵심 learning**:
- `screencapturekit` (crates.io 공식명) v2.0 이 audio + macOS 15+ mic 지원
- macOS 26 (Tahoe) 에서 unsigned binary 는 TCC anonymous 처리 → 권한 prompt 안 뜸
- Stack 확정: Tauri 강행 (sidecar 불필요)

---

## Phase 2 — STT Integration + Reconnect ✅

**기간**: Day 5-15

**완료 내용**:
- Soniox streaming websocket Rust client 구현 ✅
- 16kHz mono PCM downsample + STT 이벤트 파싱 (partial / final, seq, t_audio_ms) ✅
- Exponential backoff reconnect (1s → 2s → 4s → 8s → max 30s) ✅
- 30s ring buffer — disconnect 중 audio 손실 X ✅
- Translation queue depth 8 (bounded) + EN fallback on timeout ✅
- `transcript.jsonl` append-only WAL (crash safety) ✅
- SessionSupervisor 12-state machine (Rust 단일 owner, React events 구독) ✅

**수치**: 1h YouTube 캡처 + 네트워크 blip simulate → reconnect 작동, peak RSS < 100MB.

---

## Phase 3 — Solar Pro 3 번역 + Streaming SSE ✅

**기간**: Day 16

**완료 내용**:
- Upstage Solar Pro 3 direct API 한국어 번역 integration ✅
- Streaming SSE 번역 (real-time token 스트리밍) ✅
- Order-preserving translation pipeline (seq# 기반, out-of-order 방지) ✅
- Batch translation (2-3 final STT events 묶어서 한 LLM call) ✅
- Bartleby brand voice 시스템 프롬프트 (정중·절제) ✅

---

## Phase 4 — Meeting Mode 본진 ✅

**기간**: Day 17-21

**완료 내용**:
- `BTSidebar` — Library 진입점, 노트 list, 세션 상태 표시 ✅
- Library view — 모든 미팅 노트 (날짜별, pin, 제목 편집) ✅
- Recording session UI — 실시간 KO|EN split transcript, LIVE indicator, audio meter ✅
- `SummaryPanel` — 종료 후 TL;DR + Decisions + Action Items + Key Quotes ✅
- Upstage Solar Pro 3 finalize-on-stop (전체 transcript → 구조화 노트) ✅
- SQLite 세션 영구 보관 (앱 재시작 후 복구) ✅
- `pendingTranslation` eviction + cross-mode capture state lift ✅

**Phase 4 acceptance**: 한국어 미팅 요약이 Slack paste 수준.

---

## Phase 4.5 — Product 재정의 Cleanup ✅

**기간**: Day 22 + cleanup S1-S6 (2026-05-11)

**완료 내용**:
- Watch/Overlay 컴포넌트 전체 제거 ✅
- Mode switch (Watch ↔ Meeting) 제거 ✅
- Single dock note taker surface 로 정리 ✅
- dead transition / dead state 코드 정리 ✅
- VISION / PLAN / DESIGN / PRINCIPLES 재작성 (이 슬라이스) ✅
- design-system-extensions deprecated 마킹 ✅

**재정의 결과**: 이전 "Watch overlay + 미팅 이중 모드" → "single surface note taker (live recording + URL dub Phase 5+)"

---

## Phase 5 — Polish + Persistence + 한국어 미팅 Dogfood (next)

**목표**: 한국어 미팅 통합 dogfood 1시간 + sqlite persistence + 사용자 측정.

**핵심 컴포넌트**:
- 한국어 미팅 dogfood (translate off, KO transcript 흐름 — sentence-boundary 자연성 확인)
- SessionDetail 다시 보기 흐름 검증
- 1시간 RSS / drift / 비용 측정 + 사용자 측정 form 채우기
- In-memory localStorage → SQLite 마이그레이션 (세션 영구 보관 강화)
- Library search / filter 기본 구현

**Acceptance**: 한국어 미팅 1시간 dogfood 안정 + 노트 Slack paste 수준.

**Dependencies**: Phase 1-4 인프라 (STT pipeline, Library, localStorage) 전제.

---

## Phase 6 — Mic 실 캡처 + TTS + Export + Ship (later)

**목표**: 안정화 + 배포 준비.

**포함**:
- Mic 실 캡처 (signed binary, Apple Developer ID 서명 필요)
- TTS dub — Live recording 노트 Listen 경로 옵션 (사용자 요청 시 생성)
- Export (PDF / MD / SRT)
- File upload note (로컬 audio/video 파일 → 동일 pipeline)
- First-launch 온보딩 (provider mode/BYOK or invite token → 권한 → 첫 recording)
- Settings UI refinement
- DMG 빌드 + Developer ID 서명 + notarize
- Landing page (`heybartleby.com`)
- HN + PH launch

**Phase 6 acceptance**: 실제 배포 + waitlist 100명.

---

## Phase 6.5 — Friends hosted API relay (next)

**목표**: 지인 베타에서 BYOK friction 제거. 사용자는 DMG 설치 → 권한 → 초대 토큰만으로 녹음. Notique 가 Soniox/Upstage 비용을 부담하되 BYOK fallback 은 유지.

**결정**:
- Provider 변경 없음: Soniox `stt-rt-v4` + Upstage `solar-pro3` 유지.
- 로컬/오픈소스 모델 자동 설치 없음.
- EC2 relay 방식: `Bartleby app → api.heybartleby.com → Soniox/Upstage`.
- 서버 target: AWS Seoul `notique-agent` (`i-0eb065979dbad85b3`, `t3.micro`, Elastic IP `3.37.71.254`, SSM online).
- 자세한 계획: [HOSTED_API.md](./HOSTED_API.md).

**구현 범위**:
1. `bartleby-relay` 서버: `/health`, Soniox WebSocket proxy, Upstage summary/translation proxy.
2. Auth: private beta bearer token, 이후 per-user invite token.
3. Metering: duration seconds, byte counts, provider error class. Raw audio/transcript log 금지.
4. App provider mode: `hosted` / `byok`. Hosted 는 지인 베타 default, BYOK 는 advanced fallback.
5. Onboarding: hosted invite token 또는 BYOK keys → Microphone permission → Screen Recording permission → test recording.
6. Settings: 현재 provider mode, hosted remaining minutes, BYOK advanced keys.
7. Privacy/Terms: hosted mode 가 Notique relay 를 거친다는 문구 추가 후 public enable.

**Cost ceiling**:
- Existing EC2 baseline 약 `$15.33/month` before taxes (`t3.micro` + Elastic IP + 24GB gp3).
- Recording cost 는 Soniox 2-stream 기준 약 `$0.24/hour` + Upstage 소액.
- 10h/user/month 는 대략 `$2.50-$4.00` all-in 으로 보고, 지인 베타는 월 시간 cap 필수.

**Acceptance**:
- Notique provider keys 가 app bundle/log/client response 에 없음.
- BYOK direct path 그대로 동작.
- Hosted relay 로 10분 이상 실제 recording 성공.
- 서버-side monthly minute cap, concurrent session cap, kill switch 있음.

---

## Phase 7 — 다국어 + realtime voice exploration (future, not public v1)

**목표**: 영어 사용자 영어 미팅 transcribe + 음성 chat.

**포함**:
- 다국어 미팅 (영어 사용자 영어 미팅 — EN transcript only)
- realtime voice API 검토 (provider 미확정, public v1 surface 아님)

**진입 시점**: PMF (waitlist 100+) 이후.

---

## Stack (확정)

| 영역 | 선택 |
|---|---|
| Desktop | Tauri 2.0 + React + TS |
| ScreenCaptureKit binding | `screencapturekit` crate v2.0 (svtlabs) |
| STT | Soniox `stt-rt-v4` streaming (v0.1.1 BYOK, friends beta hosted relay planned) |
| 번역 / 요약 | Upstage `solar-pro3` direct API (v0.1.1 BYOK, friends beta hosted relay planned) |
| Hosted API | planned EC2 relay on `notique-agent`; Notique pays provider API for friends beta |
| Local ML | 없음 — 공개 빌드에 model weights 번들/자동설치 금지 |
| 최소 OS | macOS 15 Sequoia |
| 저장 | 로컬 SQLite + audio segments |
| 사용자 키 | macOS Keychain for BYOK; hosted relay secrets server-side only |
| 배포 | Developer ID 직접 DMG + Tauri Updater plugin |

---

## Storage Schema

```
~/Documents/Bartleby/
├── sessions/
│   ├── {uuid}/
│   │   ├── note.md           ← user-facing markdown (frontmatter + 요약)
│   │   ├── audio.opus        ← Opus 32kbps (retention default 30일)
│   │   ├── transcript.jsonl  ← 모든 STT events append-only WAL (영구)
│   │   └── events.jsonl      ← session lifecycle events
│   └── ...
└── library.json              ← Library fast index (제목/날짜/tag/pin)
```

**note.md frontmatter 타입**:
- `type: meeting` — live recording 노트 (요약 primary)
- `type: file` — 파일 업로드 노트 — Phase 6+

---

## Risk Register

| Risk | Probability | Mitigation |
|---|---|---|
| Soniox 정확도 부족 | 35% | 공개 surface 변경 없이 dogfood 데이터로 튜닝; provider swap 은 별도 결정 |
| Solar Pro 3 번역 품질 | 35% | prompt/UX 개선 우선; fallback provider 는 public v1 이후 별도 결정 |
| Hosted API 비용 폭주 | 30% | per-token monthly minute cap, concurrent session cap, kill switch, BYOK fallback |
| Relay privacy 혼동 | 30% | onboarding/Privacy 에 hosted vs BYOK data path 명시, raw content logging 금지 |
| Apple Developer 승인 지연 | 20% | Day 1 신청, 1주 lead time |
| Timeline slip | 40% | Phase 6/7 scope cut buffer |

---

## Next Decision Points

- Hosted relay MVP 구현 순서: server 먼저, app provider abstraction 다음
- `api.heybartleby.com` DNS + TLS cutover 시점
- SQLite 마이그레이션 시점 (Phase 5 vs Phase 6)
- TTS provider 선정 (Phase 6 시작 전 — live recording Listen 경로용)
- 오픈소스 vs source-available (Phase 6 전)
- Mac App Store vs 직접 배포 (v1.5+)
- 한국어 → 영어 외 다국어 (PMF 이후, Phase 7)
