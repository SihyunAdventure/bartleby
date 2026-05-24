# Bartleby — Korean Ears for English Meetings

> "I would prefer not to listen in English." — Let Bartleby.

## What

단일 dock 앱. 영어 라이브 미팅 에서
**한국어 transcript + 요약**을 뽑아내는 note taker.
봇 없음. 한국어 first. BYOK. 사용자 Mac 안에서 처리.

영어 미팅이 흐르는 곳이면 어디든 — Bartleby 가 들어 둡니다.

## Problem

영어 라이브 미팅에서 한국어 청자는 불리하다.

- **라이브 미팅**: 말이 빠르면 놓치고, 봇을 초대하면 어색하고, 나중에 읽을 노트는 없다.
- **기록**: 뭔가 읽거나 요약할 결과물이 남아야 한다.

기존 도구들은 미팅 bot (어색함, privacy 문제) 이거나 영어 first (한국어 후처리 조잡) 이거나 SaaS 클라우드 (vendor lock, 데이터 공유) 다.

## Vision

Bartleby 는 **dock 에 사는 Korean ears 미팅 노트 도구**.

mic + system audio 캡처 → 실시간 KO transcript → 종료 후 한국어 요약 노트.
Library 가 모든 미팅 노트를 통합한다. 노트는 같은 형태로 쌓인다.

## 출력 경로

미팅 노트를 세 가지 방식으로 소화할 수 있다:

- **Read** — transcript + 한국어 번역. 읽고 검색하고 발췌할 수 있다.
- **Skim** — TL;DR + 핵심 인용. 30초 안에 내용 파악.
- **Listen** — 한국어 TTS 더빙 audio (Phase 6 옵션). 사용자 요청 시 명시 generate.

## 핵심 기능 — Live Recording 노트 (구현됨)

봇 없이 system audio + mic 캡처. Soniox `stt-rt-v4` 스트리밍 STT,
Upstage `solar-pro3` 직접 API 로 한국어 번역과 최종 노트를 생성한다.
세션 종료 후 한국어 노트 (TL;DR + Outline + One-pager + Quote).
노트는 로컬 SQLite/오디오 세그먼트로 Library 에 영구 보관.

> 실제 사용 예: 영어 팀 미팅 녹화, 한국어 요약 Slack paste, 다음날 팔로업.

## Sibling product — Rehear

YouTube URL → 한국어 더빙 영상 재생성 은 Rehear (`~/Dev/side/rehear/`)
라는 별개 sibling product 로 분리됐다. 두 product 는 capture/STT/translate/
summary 같은 audio pipeline 인프라를 공유하지만 (Rehear 가 Bartleby 에서
fork), UX/mental model 이 다르다 — 미팅 노트는 productivity, YouTube dub
는 consumption. 별개 dock 앱, 별개 brand.

## Anti-vision

이것은 **하지 않는다**:

- **봇 입장 X** — 상대방이 미팅 봇을 인식하게 만들지 않는다. 모든 캡처는 사용자 자신의 Mac 에서.
- **클라우드 SaaS X** — Bartleby 측 서버가 transcript 를 보관하거나 처리하지 않는다. 결과물은 사용자 Mac 에.
- **BYOK** — Soniox (STT) + Upstage (LLM) 키를 사용자가 직접 소유. vendor lock 없음. macOS Keychain 보관.
- **숨은 모델 X** — OpenRouter, Whisper/Ollama, Claude/Gemini/GPT fallback 은 공개 surface 가 아니다.
- **한국어 ↔ 영어 pair 외 다국어 X** — 한국어 청자에게 집중한다. 다국어 지원은 PMF 이후.
- **DRM 영상 X** — ScreenCaptureKit Apple 정책 차단. Netflix · Disney+ · Apple TV+ 등 재생 불가. Advertised non-feature.

## First user

본인 (Sihyun) — 영어 협업 미팅이 있는 솔로 개발자.
미팅 녹화가 필요한 영어 협업 상황.
매일 dogfood.

## First 100 users

**라이브 미팅 사용자**:
- 영어 1on1 부담스러운 글로벌 회사 PM
- 해외 클라이언트 미팅 늘리고 싶은 프리랜서
- 영어 미팅 시작하고 싶은 솔로 창업자
- 영어 tech talk / 컨퍼런스 녹화가 필요한 한국 개발자

## Stack (2026-05-11 기준)

| 영역 | 선택 |
|---|---|
| Desktop | Tauri 2.0 (Rust + React + TS) |
| STT | Soniox streaming (BYOK, EN/KO) |
| LLM | Upstage `solar-pro3` direct API (BYOK) |
| 캡처 | ScreenCaptureKit (macOS 15+, mic + system audio) |
| 저장 | 로컬 SQLite + audio segments |
| 사용자 키 | macOS Keychain (Soniox + Upstage) |

## Non-goals (v1)

- 모바일 앱
- 클라우드 sync (사용자가 Dropbox/iCloud 폴더 지정은 가능)
- 팀 / collaboration
- 자동 미팅 감지
- YouTube URL 더빙 (→ Rehear sibling repo)
- 파일 업로드 (Phase 6+)
- Mac App Store 배포 (v1.5+)
- DRM 영상 (영구 X)
- 한국어 ↔ 영어 외 다국어

## Brand voice

정중하고 절제됨. Melville 의 바틀비 캐릭터.
"I would prefer not to" 의 의도된 아이러니.

- 시스템 메시지 (recording): *"Bartleby has prepared your notes."*
- Error: *"Bartleby would prefer not to. (권한 거부됨)"*

### 카피

- "Korean ears for English content."
- "받아 듣기 싫은 영상은 받아 들으니까."
- "When listening to English is hard, Bartleby listens for you."
- "Your keys. Your notes. Your Bartleby."
- "Bartleby would prefer not to. So you don't have to."

## 도메인 / 채널

- 도메인: heybartleby.com
- Twitter/X: @heybartleby
- Email: hello@heybartleby.com

## Distribution 전략

- 한국 indie dev / 학습자 / community 30%+ pre-launch effort
- 채널: 개인 Twitter / 한국 dev 디스코드 / GeekNews / 깃헙 / dogfood 영상 자체 콘텐츠

---

## 기록

- 2026-05-07: 초안 작성 — Watch overlay + Meeting 이중 모드 product
- 2026-05-07: autoplan CEO review (codex + critic) — wedge / pricing / timeline 검토
- 2026-05-07: Tauri scaffold + ScreenCaptureKit spike ✅
- 2026-05-07 ~ 05-11: Phase 1-4 구현 (Capture / STT / 번역 / Meeting 본진)
- 2026-05-11: Phase 4.5 product 재정의 — Watch overlay → single dock note taker.
  Live recording (미팅 노트) 구현 완료.
- 2026-05-12: Wedge 2 분리 → Rehear sibling repo (`~/Dev/side/rehear/`).
  Bartleby = 미팅 노트 only. Phase 5+ 재정의.
