# Bartleby — Korean Ears for English Audio

> "I would prefer not to listen in English." — Let Bartleby.

## What

Cloud-powered Mac 앱. 영어가 들리는 모든 곳 (YouTube · 컨퍼런스 · podcast · 미팅) 에서
**실시간 한국어 자막 + 후처리 노트**. 봇 없음. 한국어 first.

영어 듣기 어려운 영상까지 바틀비가 들어 줍니다.

## Why now

- ScreenCaptureKit (macOS 12.3+) = system audio 캡처 진입 장벽 낮음
- Soniox 스트리밍 EN STT = 한 시간 영상 라이브 자막 가능
- Solar Pro 3 (Korean SOTA, Upstage) = 한국어 번역 SOTA + 매우 저렴 (128K context)
- Granola·Otter·Anarlog 모두 *미팅* only — *영어 콘텐츠 소비* 시장 미충족
- BYOK 모델 = 빠른 출시, vendor lock 회피

## Wedge — 정직한 differentiator

미팅 노트 카테고리 자체는 commodity. 진짜 wedge 는 **콘텐츠 모드** 추가:

- ⭐ **시청 모드 (YouTube 등 영어 콘텐츠 라이브 자막)** — Granola/Otter/Anarlog 모두 안 가는 카테고리. 영상 위 floating overlay 로 실시간 한국어 자막. 종료 후 노트 옵션.
- **미팅 모드 (한↔영 양방향)** — 표준 미팅 노트 + 라이브 transcript + 후처리 요약. 영어 미팅 *가능하게 만드는* 도구 (영어 못 해서 미팅 못 하던 사용자가 시작할 수 있게).
- **No-bot** — 미팅 / 콘텐츠 모두 봇 없음 (Granola 와 동일 = 표 stakes, 메인 wedge 는 아님).
- **Local data ownership** — 노트는 로컬 plain markdown. Export·migrate 자유.
   (오디오·transcript 처리는 클라우드, 단 *결과물* 은 본인 Mac 에 영구 보유)
- **BYOK** — vendor lock 회피, control/compliance.
   (가격 선택 사양 — *cheap claim 아님*. Granola flat $14/월 vs Bartleby $5 + 사용량 = 가격은 사용량에 비례. 컨트롤이 wedge.)
- **Character brand** — Melville 의 바틀비. 정중하고 절제됨. "I would prefer not to" 톤.

### Wedge 한 줄

> Bartleby = "영어가 들리는 곳이면 어디든 — Korean ears for English audio."
> (NOT just meeting notes. Live caption + post-hoc notes for any English audio source on macOS.)

## What we are NOT

- **Local-first audio processing 아님** — 오디오는 Soniox 로, transcript 는 OpenRouter 로 전송됨
- 단, 사용자가 *자기 키* 로 자기 cloud account 통해 처리. Vendor lock 없음
- **DRM 영상 (Netflix · Disney+ · Apple TV+) 캡처 안 됨** — Apple 정책상 ScreenCaptureKit 차단. *Advertised non-feature*. YouTube · 일반 웹 video · 컨퍼런스 영상 · 팟캐스트 OK.
- **Mac App Store 배포 v1 X** — 직접 DMG + Developer ID notarization. Sandbox 호환성은 v1.5+ 검증.
- 데이터는 본인 markdown 파일로 영구 보유, 언제든 export·migrate

## First user

본인 (Sihyun) — *매일 1시간+ 영어 YouTube/tech talk 시청* 하는 솔로 dev.
미팅 모드는 사용자 본인의 *suppressed demand* (영어 못 해서 안 하던 미팅을 가능하게).
매일 dogfood.

## First 100 users (가설)

1차 segment: **한국 영어 콘텐츠 소비자**
- 영어 tech talk / 컨퍼런스 영상 매일 보는 한국 개발자
- 영어 인터뷰 / 강의 / 팟캐스트 챙겨 보는 한국 학습자
- 해외 YouTube tutorial 로 학습하는 한국 디자이너 / PM

2차 segment (suppressed demand 활성화): **한↔영 bilingual 미팅 능력 필요한 한국 전문가**
- 영어 미팅 시작하고 싶은 솔로 창업자
- 해외 클라이언트 미팅 늘리고 싶은 프리랜서
- 영어 1on1 부담스러운 글로벌 회사 PM

→ 영어 콘텐츠 소비 (현재 daily action) 로 진입, 미팅 모드는 능력 확장 후 자연 활성화.

## Stack (2026-05-07 기록 — Week 1 spike 결과로 재검증)

| 영역 | 선택 | Caveat |
|---|---|---|
| Desktop | Tauri 2.0 (Rust + React + TS) | Week 1 spike 결과로 강행 / pivot 결정 |
| STT | Soniox streaming (BYOK) | EN/KO 양방향. 가격 $0.12~0.30/hr 검증 필요 |
| LLM | Solar Pro 3 via OpenRouter (BYOK) | 번역 + 요약 단일 모델, 128K context |
| 캡처 | ScreenCaptureKit (macOS 12.3+) | mic+system / system-only 두 모드 |
| 저장 | 로컬 markdown | iCloud/Dropbox sync 는 사용자가 폴더 지정 |
| 사용자 키 | Soniox + OpenRouter (총 2개) | 1-key onboarding 검토 |

### Stack contingency (Week 1 spike 결과)

| Spike 결과 | 결정 |
|---|---|
| ✅ Tauri+Rust 로 mic + system audio 1시간 stable 캡처 | Tauri 강행 (사용자 선호 + 디자인 시스템 React 자산 보존) |
| ⚠️ system audio mixing 만 불안정 | Tauri UI + Swift sidecar (Anarlog 패턴 정독 필요) |
| ❌ ScreenCaptureKit Rust 작동 X | Native SwiftUI pivot, 디자인 시스템 SwiftUI 재작성 (1주 추가) |

## v1 Non-goals

- 모바일 앱 (v2.0)
- 클라우드 sync (v2.0, 단 markdown 은 사용자가 Dropbox/iCloud 로 자유 sync 가능)
- 팀 / collaboration 기능
- 자동 미팅 감지 (v1.5)
- 정밀 화자 다이어라이제이션 (v1.5)
- Bot 모드 (영구 X)
- 로컬 STT/LLM 옵션 (v2.0+, 사용자 요청 많으면)
- Windows / Linux 데스크탑 (Tauri 라 가능하지만 후순위)
- **TTS 팟캐스트 재생성 (v1.5+)** — 후처리 영어 → 한국어 audio 재합성. 사용자 use case 인정, scope 보호 위해 v1 컷.
- **yt-dlp 자막 추출 후처리 (v1.5+)** — 시청 모드 alternative. Soniox 비용 절약 시 옵션.
- **Follow-up email schema (v1.5+)** — 미팅 모드 후처리 추가 시그니처. v1.5 dogfood 데이터로 결정.
- **Mac App Store 배포** (v1.5+, sandbox 검증 후)
- **DRM 영상** (Netflix 등) — Apple 정책 차단, 영구 X

## Pricing (가설)

- **v1**: 무료 + waitlist (PMF 검증 단계, 본인 dogfood + 5명 베타)
- **v1.5**: $5/월 또는 $50/년 flat — 사용량 무제한 (Bartleby 측 cost 0, BYOK 라)
- 사용자 총 비용 = $5/월 (Bartleby) + 사용량별 BYOK
  - 라이트 (10시간 영상 시청 + 5 미팅): ~$8/월
  - 헤비 (30시간 시청 + 30 미팅): ~$25/월
- 비교: Granola $14/월 (미팅 only, 사용량 제한, 영어 first)
- **Pricing positioning**: "BYOK = cheap" 마케팅 X. "BYOK = control / compliance / vendor 자유" 가 메시지.

## Cost (사용자 부담, BYOK)

- 라이트 (10h 영상 + 5 미팅/월): ~$3-8/월 (Soniox 시간당 가격 변동)
- 헤비 (30h 영상 + 30 미팅/월): ~$15-25/월

(plan 의 $0.30/hr Soniox 가격은 codex web search 결과 ~$0.12/hr 로 보임. Week 1 가입 시 직접 검증 후 cost model 업데이트.)

## Brand voice

정중하고 절제됨. Melville 의 바틀비 캐릭터.
"I would prefer not to" 의 의도된 아이러니.

- 마케팅 카피: 차분하고 위트
- 시스템 메시지 (시청 모드): "Bartleby has prepared your translation."
- 시스템 메시지 (미팅 모드): "Bartleby has prepared your notes."
- Error: "Bartleby would prefer not to. (권한 거부됨)"

### 카피 후보

- "Korean ears for English audio."
- "받아 듣기 싫은 영상은 받아 들으니까."
- "When listening to English is hard, Bartleby listens for you."
- "Cloud-powered. Locally owned."
- "Your keys. Your data. Your characters."
- "Bartleby would prefer not to. So you don't have to."
- "Markdown forever. No vendor lock-in."

## 도메인 / 채널

- 도메인: heybartleby.com
- GitHub: heybartleby/bartleby
- Twitter/X: @heybartleby
- Email: hello@heybartleby.com

## Distribution 전략 (autoplan 추가)

원래 PLAN 에 distribution 0 hours 였음. 추가:

- 한국 indie dev / YouTuber / 학습자 community 30%+ pre-launch effort
- 영어 콘텐츠 소비 (개발 / 학습 / 디자인) 한국 niche 에 *Bartleby 가 그 이름* 되도록
- 채널: 개인 Twitter / 한국 dev 디스코드 / GeekNews / 깃헙 / dogfood 영상 자체 콘텐츠
- HN/PH 만으로는 한국 PMF 검증 안 됨 (codex 권고)

## Risk & contingency

| Risk | Probability | Mitigation |
|---|---|---|
| Granola 한국어 추가 | 40-50% (6개월) | 미팅 only 임. 콘텐츠 모드는 안 옴 — wedge 살아있음 |
| Anarlog Korean fork | 25% | 라이브 자막 + 한국어 deep optimization 으로 차별 |
| Soniox 한국어 정확도 부족 | 35% | Phase 1 spike 에서 Whisper / Naver Clova 비교 |
| Solar Pro 3 번역 품질 부족 | 35% | OpenRouter 라 Claude/Gemini 즉시 swap |
| Tauri+Rust ScreenCaptureKit 막힘 | 25% | Stack contingency (위 표) — Swift sidecar 또는 native pivot |
| 12-14주 timeline 슬립 | 50% | scope cut buffer 확보 (Phase 4 search/library 우선 컷) |
| Apple Developer 승인 지연 | 20% | Day 1 신청, 1주 lead time |
| DRM 영상 사용 기대 | low | Advertised non-feature 명시 |

---

## 기록

- 2026-05-07 plan 작성 (미팅 only 노트)
- 2026-05-07 Claude Design handoff (디자인 시스템 lock)
- 2026-05-07 autoplan CEO review (codex + critic) — wedge / pricing / timeline / sequencing critical 발견
- 2026-05-07 reframe — 사용자 daily reality (영어 YouTube 1h+/일, 미팅 suppressed) 기반으로 *영어 콘텐츠 + 미팅 dual-mode* 로 재정렬
