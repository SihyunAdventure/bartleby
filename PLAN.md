# Bartleby — v1 Execution Plan

- 시작: 2026-05-07
- 타겟 출시: **2026-08-13 ~ 2026-08-27** (12-14주, 원래 8주에서 연장)
- Solo dev: 김시현
- v1 acceptance: HN / PH launch + waitlist 100+

---

## §0 핸드오프 — autoplan 결정사항 (2026-05-07)

이전 plan (8주, 미팅 only) 은 autoplan 의 CEO dual voice review (codex + critic) 에서
critical 신호 6/9 받음. 사용자 daily reality (매일 영어 YouTube 1h+, 미팅은 영어 능력
부족으로 suppressed) 기반 reframe 진행. 핵심 변경:

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

자세한 critical 발견 + decision rationale 은 이번 세션 transcript 참조.

---

## §1 v1 스코프 — Korean ears for English audio (Mac only)

### 두 모드 (공통 stack: ScreenCaptureKit + Soniox + Solar Pro 3)

| Mode | 캡처 source | UI | 출력 |
|---|---|---|---|
| **시청 모드** (YouTube/podcast/컨퍼런스) | system audio only | Floating overlay window (영상 위) | 실시간 KO 자막 + 종료 후 노트 옵션 |
| **미팅 모드** | mic + system audio | Sidebar 노트 view | 실시간 KO/EN transcript + 종료 후 한국어 요약 |

**모드 전환**: Sidebar 토글 또는 ⌘⇧B (시청 모드 토글) / ⌘⇧M (미팅 모드 토글).

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

> **결정 (autoplan)**: UI 보다 capture 검증 먼저. UI 7일 만들어놓고 Phase 1 에서 막히면
> 디자인 폐기 위험. spike 가 stack contingency trigger.

#### Spike 목표 (~3-5일)
- [ ] Tauri 2.0 + Rust 프로젝트 생성
- [ ] `screencapturekit-rs` (또는 fork) 로 ScreenCaptureKit binding 검증
- [ ] System audio capture 1시간 안정성 (YouTube 영상 1h 시청 시뮬레이션)
- [ ] mic + system audio mixing (미팅 모드 prep)
- [ ] Opus 32kbps encoding + 로컬 .opus 저장
- [ ] 권한 요청 플로우 (Microphone, Screen Recording)
- [ ] **Anarlog (`fastrepl/anarlog`) 코드 정독** — 이미 작동하는 패턴 차용

#### Spike 결정 gate
- ✅ 1시간 stable 캡처 → Tauri 강행, Phase 0 UI 시작
- ⚠️ system audio 만 불안정 → Tauri UI + Swift sidecar fallback
- ❌ ScreenCaptureKit Rust 실패 → Native SwiftUI pivot, 1주 추가 비용 인정

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

Spike 결과를 production-grade 로:
- [ ] Tauri command: `start_meeting`, `start_watch`, `stop_recording`, `get_recording_state`
- [ ] React side: 모드별 캡처 source 분기 (시청 = system only, 미팅 = mic + system)
- [ ] 권한 거부 case 처리 (Bartleby would prefer not to. 톤)
- [ ] **DRM 영상 감지 + 안내** — ScreenCaptureKit 차단 시 사용자 친절 메시지
- [ ] 디스크 저장 (.opus, retention 30일 default)

**Phase 0 + 1 acceptance**: 클릭 가능한 UI shell + ⌘⇧B/⌘⇧M 로 캡처 시작/종료, .opus 파일 저장, 시스템+마이크 오디오 둘 다 들림.

---

### Week 4 (2026-05-28 → 2026-06-03) — Phase 2: Streaming STT + Live UI

#### 시청 모드 (priority 1 — 사용자 daily pain)
- [ ] Soniox websocket Rust client (또는 Tauri sidecar)
- [ ] System audio chunk 를 websocket 으로 stream
- [ ] EN STT event 파싱 (partial / final, timestamps)
- [ ] **Floating overlay window** (Tauri NSPanel-equivalent):
  - [ ] 영상 위 표시, drag·resize, opacity 30~100%
  - [ ] partial = `--partial` 색 + italic
  - [ ] final = `--ink` 색 + lock + 한국어 번역 stream
  - [ ] 세션 종료 버튼
- [ ] Solar Pro 3 streaming translation (final 시점 호출, parallel)

#### 미팅 모드
- [ ] React: Live meeting 레이아웃 (사이드바 축소 + KO|EN 좌우 split)
- [ ] Bilingual STT (Soniox 의 language detection 또는 사용자 선택)
- [ ] Real-time translation (final → Solar Pro 3)
- [ ] LIVE indicator + timer
- [ ] 미팅 제목 인라인 편집
- [ ] 일시정지 / 재개 / 종료

**Phase 2 acceptance**: 본인이 영어 YouTube 1시간 시청 → 라이브 한국어 자막 overlay. 별도로 영어 미팅 1시간 → KO|EN split panel 라이브 transcript.

---

### Week 5 (2026-06-04 → 2026-06-10) — Phase 3: 후처리 (요약 / 노트)

#### 시청 모드 후처리
- [ ] 영상 끝나면 자막 전체 누적 → "한국어 요약 만들기" 옵션
- [ ] Solar Pro 3 요약 (5-10문장)
- [ ] Markdown 파일 저장:

```yaml
---
title: <YouTube 제목 또는 사용자 입력>
date: 2026-06-08T14:30:00Z
duration: 47m
type: watch
source: <YouTube URL 또는 'system audio'>
---
## TL;DR
3-5 문장 한국어 요약

## Key Points
- 핵심 1
- 핵심 2

## Full Transcript (EN)
(영어 원본)

## Translation (KO)
(한국어 자막)
```

#### 미팅 모드 후처리
- [ ] Solar Pro 3 요약 호출
- [ ] Markdown frontmatter:

```yaml
---
title: <auto-generated>
date: 2026-06-08T14:30:00Z
duration: 47m
type: meeting
language: ko/en/mixed
participants: [김시현, ...]
tags: []
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
(원본)
```

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
- [ ] Sparkle 자동 업데이트 SPM 추가 (EdDSA 키, appcast.xml GitHub Pages)

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
| 최소 OS | macOS 14 Sonoma |
| 아키텍처 | Apple Silicon + Intel universal |
| 배포 | Developer ID 직접 다운로드 (Sparkle 자동 업데이트) |

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
