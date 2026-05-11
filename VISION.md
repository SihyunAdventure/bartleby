# Bartleby — Korean Ears for English Content

> "I would prefer not to listen in English." — Let Bartleby.

## What

단일 dock 앱. 영어 audio source (라이브 미팅 · YouTube URL · 파일) 에서
**한국어 transcript + 요약 + (옵션) TTS 더빙**을 뽑아내는 note taker.
봇 없음. 한국어 first. BYOK. 사용자 Mac 안에서 처리.

영어 audio 가 흐르는 곳이면 어디든 — Bartleby 가 들어 둡니다.

## Problem

영어 audio 가 흐르는 모든 곳에서 한국어 청자는 불리하다.

- **라이브 미팅**: 말이 빠르면 놓치고, 봇을 초대하면 어색하고, 나중에 읽을 노트는 없다.
- **YouTube 강연 / podcast / 컨퍼런스**: 한국어 자막이 없거나, 더빙 영상을 찾아야 하거나, 자막 켜도 자동 번역 품질이 낮다.
- **기록**: 어디서 들었든, 뭔가 읽거나 요약할 결과물이 남아야 한다.

기존 도구들은 미팅 bot (어색함, privacy 문제) 이거나 영어 first (한국어 후처리 조잡) 이거나 SaaS 클라우드 (vendor lock, 데이터 공유) 다.

## Vision

Bartleby 는 **dock 에 사는 Korean ears 도구**.

모든 영어 audio source 가 같은 backend pipeline 을 통과한다.
출력 형태만 source 에 따라 다르다:

| Source | 기본 출력 |
|---|---|
| **Live recording** (mic + system audio) | 실시간 KO transcript → 종료 후 한국어 요약 노트 |
| **YouTube URL** | audio 추출 → 배치 STT → 번역 → 한국어 더빙 영상 (Phase 5+) |
| **File upload** | 동일 pipeline (Phase 6+) |

Library 가 모든 source 의 노트를 통합한다. source 가 달라도 노트는 같은 형태로 쌓인다.

## 세 출력 경로

어떤 source 든 세 가지 방식으로 소화할 수 있다:

- **Read** — transcript + 한국어 번역. 읽고 검색하고 발췌할 수 있다.
- **Skim** — TL;DR + 핵심 인용. 30초 안에 내용 파악.
- **Listen** — 한국어 TTS 더빙 audio. source 재생 속도로 다시 듣기.
  - URL note 는 자동 생성 (pipeline 의 최종 단계).
  - Live recording 은 명시 generate (사용자 요청 시).

## 두 기능 (v1 + Phase 5)

### Wedge 1 — Live Recording 노트 (구현됨)

봇 없이 system audio + mic 캡처. Soniox 스트리밍 STT, Solar Pro 3 한국어 번역.
세션 종료 후 한국어 요약 (TL;DR + Decisions + Action Items + Key Quotes).
노트는 로컬 markdown, Library 에 영구 보관.

> 실제 사용 예: 영어 팀 미팅 녹화, 한국어 요약 Slack paste, 다음날 팔로업.

### Wedge 2 — YouTube URL → 한국어 더빙 (Phase 5+)

URL 입력 → audio 추출 → 배치 STT → 번역 → TTS → 한국어 음성 mux.
영어 강연 / podcast / 인터뷰 를 한국어 음성으로 *그대로* 다시 듣기.
풀버전 유지, 요약 X (Listen 경로의 완성).

> 실제 사용 예: Andrej Karpathy 강연 URL → 한국어 더빙 mp4 로 저장 → 출퇴근길 재청.

## Anti-vision

이것은 **하지 않는다**:

- **봇 입장 X** — 상대방이 미팅 봇을 인식하게 만들지 않는다. 모든 캡처는 사용자 자신의 Mac 에서.
- **클라우드 SaaS X** — Bartleby 측 서버가 transcript 를 보관하거나 처리하지 않는다. 결과물은 사용자 Mac 에.
- **BYOK** — Soniox (STT) + OpenRouter (LLM) 키를 사용자가 직접 소유. vendor lock 없음. macOS Keychain 보관.
- **한국어 ↔ 영어 pair 외 다국어 X** — 한국어 청자에게 집중한다. 다국어 지원은 PMF 이후.
- **DRM 영상 X** — ScreenCaptureKit Apple 정책 차단. Netflix · Disney+ · Apple TV+ 등 재생 불가. Advertised non-feature.

## First user

본인 (Sihyun) — 영어 tech talk / YouTube 강연을 매일 1시간+ 보는 솔로 개발자.
미팅 녹화가 필요한 영어 협업 상황.
매일 dogfood.

## First 100 users

**영어 콘텐츠 소비자 (1차)**:
- 영어 tech talk / 컨퍼런스 영상 매일 보는 한국 개발자
- 영어 인터뷰 / 강의 / 팟캐스트 챙겨 보는 한국 학습자
- 해외 YouTube tutorial 로 학습하는 한국 디자이너 / PM

**라이브 미팅 사용자 (2차, suppressed demand)**:
- 영어 1on1 부담스러운 글로벌 회사 PM
- 해외 클라이언트 미팅 늘리고 싶은 프리랜서
- 영어 미팅 시작하고 싶은 솔로 창업자

## Stack (2026-05-11 기준)

| 영역 | 선택 |
|---|---|
| Desktop | Tauri 2.0 (Rust + React + TS) |
| STT | Soniox streaming (BYOK, EN/KO) |
| LLM | Solar Pro 3 via OpenRouter (BYOK, 128K context) |
| 캡처 | ScreenCaptureKit (macOS 15+, mic + system audio) |
| 저장 | 로컬 markdown (`~/Documents/Bartleby/`) |
| 사용자 키 | macOS Keychain (Soniox + OpenRouter) |

## Non-goals (v1)

- 모바일 앱
- 클라우드 sync (사용자가 Dropbox/iCloud 폴더 지정은 가능)
- 팀 / collaboration
- 자동 미팅 감지
- YouTube URL 더빙 (Phase 5+)
- 파일 업로드 (Phase 6+)
- Mac App Store 배포 (v1.5+)
- DRM 영상 (영구 X)
- 한국어 ↔ 영어 외 다국어

## Brand voice

정중하고 절제됨. Melville 의 바틀비 캐릭터.
"I would prefer not to" 의 의도된 아이러니.

- 시스템 메시지 (recording): *"Bartleby has prepared your notes."*
- 시스템 메시지 (URL dub): *"Bartleby has prepared your translation."*
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
  Wedge 1 (live recording) 구현 완료. Wedge 2 (YouTube URL dub) Phase 5 로 설정.
