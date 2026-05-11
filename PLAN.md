# Bartleby — Execution Plan

- 시작: 2026-05-07
- Solo dev: 김시현
- v1 acceptance: Live recording 노트 dogfood 안정화 + waitlist 100+

---

## 제품 정의 (2026-05-11 기준)

단일 dock Finder-like note taker. 두 기능:

1. **Live recording 노트** (구현됨) — mic + system audio → 실시간 KO transcript → 종료 후 한국어 요약 노트. Library 에 영구 보관.
2. **YouTube URL → 한국어 더빙** (Phase 5+) — URL 입력 → audio 추출 → 배치 STT → 번역 → TTS → 더빙 영상.

통합 framing: "Korean ears for English content." 세 출력 경로 — Read / Skim / Listen.

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
- Solar Pro 3 via OpenRouter 한국어 번역 integration ✅
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
- Solar Pro 3 batch summarize (전체 transcript → 구조화 요약) ✅
- localStorage 세션 영구 보관 (앱 재시작 후 복구) ✅
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

## Phase 5 — YouTube URL → 한국어 더빙 (next)

**목표**: URL 입력 → 한국어 더빙 mp4/audio 출력.

**핵심 컴포넌트**:
- `yt-dlp` or 직접 extraction — YouTube audio 다운로드
- 배치 STT (Soniox) — 전체 audio → full transcript
- 번역 (Solar Pro 3) — 전체 transcript → KO translation
- TTS — KO text → 한국어 음성 (provider TBD: Google TTS / Naver Clova / ElevenLabs)
- Audio mux — 원본 영상 + 한국어 음성 합성
- Library URL note 진입점 — URL 입력 UI + 진행 상태 표시
- Note detail view — dub output (Listen 경로 primary)

**Acceptance**: Andrej Karpathy / 3Blue1Brown 강연 URL → 한국어 더빙 mp4 재생 가능.

**Key risks**:
- TTS 음성 자연스러움 (provider 선정 + 테스트 필요)
- YouTube extraction 속도 / 정책 변경 대응
- Long audio batching 비용 모델 (긴 강연 = STT + TTS 둘 다 분량 기반 과금)

**Dependencies**: Phase 1-4 인프라 (STT pipeline, storage schema, Library) 전제.

---

## Phase 6 — Stabilization + Polish + Ship (later)

**목표**: 안정화 + 배포 준비.

**포함**:
- Mic 실 캡처 (signed binary, Apple Developer ID 서명 필요)
- TTS dub — Live recording 노트도 Listen 경로 옵션
- Export (PDF / MD / SRT)
- Library search / filter
- File upload note (로컬 audio/video 파일 → 동일 pipeline)
- First-launch 온보딩 (3 steps: BYOK 키 입력 → 권한 → 첫 recording)
- Settings UI refinement
- DMG 빌드 + Developer ID 서명 + notarize
- Landing page (`heybartleby.com`)
- HN + PH launch

**Phase 6 acceptance**: 실제 배포 + waitlist 100명.

---

## Stack (확정)

| 영역 | 선택 |
|---|---|
| Desktop | Tauri 2.0 + React + TS |
| ScreenCaptureKit binding | `screencapturekit` crate v2.0 (svtlabs) |
| STT | Soniox streaming (BYOK, EN/KO) |
| 번역 / 요약 | Solar Pro 3 via OpenRouter (BYOK, 128K) |
| 최소 OS | macOS 15 Sequoia |
| 저장 | 로컬 markdown (`sessions/{uuid}/`) |
| 사용자 키 | macOS Keychain |
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
- `type: url` — YouTube URL 노트 (더빙 output primary) — Phase 5+
- `type: file` — 파일 업로드 노트 — Phase 6+

---

## Risk Register

| Risk | Probability | Mitigation |
|---|---|---|
| Soniox 정확도 부족 | 35% | OpenRouter 라 Whisper / 다른 provider swap |
| Solar Pro 3 번역 품질 | 35% | Claude / Gemini 즉시 swap |
| TTS 음성 자연스러움 (Phase 5) | 50% | provider 여러 개 테스트 후 결정 |
| YouTube extraction 정책 변경 | 25% | yt-dlp 유지 전략 + fallback |
| Apple Developer 승인 지연 | 20% | Day 1 신청, 1주 lead time |
| Timeline slip | 40% | Phase 5/6 scope cut buffer |

---

## Next Decision Points

- TTS provider 선정 (Phase 5 시작 전)
- YouTube extraction 방식 (yt-dlp vs API)
- dub output 형식 (mp4 mux vs audio-only mp3)
- 오픈소스 vs source-available (Phase 6 전)
- Mac App Store vs 직접 배포 (v1.5+)
- 한국어 → 영어 외 다국어 (PMF 이후)
