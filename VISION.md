# Bartleby — Meeting Scrivener

> "I would prefer not to take notes." — Let Bartleby.

## What

Cloud-powered Mac AI 미팅 노트. 봇 없음. 한국어 first.
받아 적기 싫은 미팅까지 바틀비가 받아 적습니다.

## Why now

- Whisper open-weights + Soniox 스트리밍 = 미팅 transcription 진입 장벽 낮음
- Solar Pro 3 (Korean SOTA, Upstage) = 한국어 번역·요약 SOTA + 매우 저렴
- Granola·Otter 는 다 클라우드 + 영어 우선 — 한국 사용자 미충족 시장
- BYOK 모델 = 사용자 비용 1/3, 마진 0, 빠른 출시

## Wedge (vs Granola, Otter, Anarlog)

- **No-bot** — 미팅에 봇 안 들어감 (Granola 와 동일)
- **Korean-first** — Soniox + Solar Pro 3 로 한↔영 양방향 SOTA.
   다른 메이저 앱 모두 영어 first.
- **BYOK** — Granola/Otter 의 marked-up 구독 vs 사용자 자기 키.
   사용자 비용 1/3, 우리 마진 0.
- **Character brand** — "I would prefer not to" 톤. 인격화된 비서.
- **Local data ownership** — 노트는 로컬 plain markdown. Export·migrate 자유.
   (오디오·transcript 처리는 클라우드, 단 *결과물* 은 본인 Mac 에 영구 보유)

## What we are NOT

- **Local-first audio processing 아님** — 오디오는 Soniox 로, transcript 는 OpenRouter 로 전송됨
- 단, 사용자가 *자기 키* 로 자기 cloud account 통해 처리
- Vendor lock-in 없음 — 데이터는 본인 markdown 파일로 영구 보유, 언제든 export·migrate

## First user

본인 (Sihyun) — 모든 미팅 녹음·번역·요약. 매일 dogfood.

## First 100 users (가설)

한↔영 bilingual 미팅 자주 하는 한국 지식 노동자:
- 솔로 창업자 (해외 투자자·고객 미팅)
- 프리랜서 디자이너·개발자 (해외 클라이언트)
- 글로벌 회사 PM·매니저 (1on1, 팀 미팅)

## Stack (locked in 2026-05-07)

- Desktop: Tauri 2.0 (Rust + React)
- STT: Soniox streaming (BYOK, $0.30/hr)
- LLM: Solar Pro 3 via OpenRouter (BYOK, $0.15/$0.60 per 1M)
  - 번역 + 요약 모두 단일 모델
  - 128K context (모든 미팅 처리)
- 저장: 로컬 markdown
- 사용자 키: Soniox + OpenRouter (총 2개)

## v1 Non-goals

- 모바일 앱 (v2.0)
- 클라우드 sync (v2.0, 단 markdown 은 사용자가 Dropbox/iCloud 로 자유 sync 가능)
- 팀 / collaboration 기능
- 자동 미팅 감지 (v1.5)
- 정밀 화자 다이어라이제이션 (v1.5)
- Bot 모드 (영구 X)
- 로컬 STT/LLM 옵션 (v2.0+, 사용자 요청 많으면)
- Windows / Linux 데스크탑 (Tauri 라 가능하지만 후순위)

## Pricing (가설)

- v1: 무료 + waitlist (PMF 검증 단계)
- v1.5: $5/월 또는 $50/년 flat (사용량 무제한, BYOK 라 무관)
- 사용자 총 비용 = $5/월 (Bartleby) + $10-35/월 (BYOK STT+LLM)
- 비교: Granola $14/월 (사용량 제한 있음, 클라우드 STT, English-first)

## Cost (사용자 부담, BYOK)

- 라이트 (30 미팅/월): ~$10/월
- 헤비 (110 미팅/월): ~$35/월

## Brand voice

정중하고 절제됨. Melville 의 바틀비 캐릭터.
"I would prefer not to" 의 의도된 아이러니.

- 마케팅 카피: 차분하고 위트
- 시스템 메시지: "Bartleby has prepared your notes."
- Error: "Bartleby would prefer not to. (권한 거부됨)"

### 카피 후보

- "Cloud-powered. Locally owned."
- "Your keys. Your data. Your characters."
- "Granola for Korean — at a third of the cost."
- "Bartleby takes notes. Then leaves you alone."
- "Markdown forever. No vendor lock-in."

### Wedge 한 줄

> Bartleby = "BYOK + No-bot + Korean-first + Character + Markdown forever"
> (NOT local-first. Cloud-powered with local data ownership.)

## 도메인 / 채널

- 도메인: heybartleby.com
- GitHub: heybartleby/bartleby
- Twitter/X: @heybartleby
- Email: hello@heybartleby.com
