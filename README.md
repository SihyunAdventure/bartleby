# Bartleby

> "I would prefer not to listen in English." — Let Bartleby.

Cloud-powered Mac 앱. 영어가 들리는 모든 곳 (YouTube · 컨퍼런스 · podcast · 미팅) 에서
실시간 한국어 자막 + 후처리 노트. 봇 없음. 한국어 first.

## 빠른 컨텍스트

- **카테고리**: macOS 영어 audio → Korean understanding layer
- **두 모드**: 시청 모드 (영상 위 floating overlay 라이브 자막) + 미팅 모드 (sidebar 노트 view)
- **타겟**: 매일 영어 콘텐츠 보는 한국 개발자/학습자 + 영어 미팅 능력 필요한 한국 전문가
- **첫 사용자**: Sihyun (본인 dogfood — 매일 영어 YouTube 1h+)
- **상태**: 계획 단계 완료, autoplan CEO review 완료, Week 1 (capture spike) 진입 직전
- **타겟 출시**: 2026-08-13 ~ 2026-08-27 (12-14주)

## 문서 구조

| 파일 / 폴더 | 내용 |
|---|---|
| [VISION.md](./VISION.md) | 제품 비전, 포지셔닝, wedge, 카피 |
| [DESIGN.md](./DESIGN.md) | 디자인 시스템 high-level summary (실제 spec 은 ↓) |
| [design-system/](./design-system/) | ⭐ 디자인 시스템 **source of truth** (Claude Design handoff, 영구 read-only) |
| [PRINCIPLES.md](./PRINCIPLES.md) | ⭐ 디자인 구현 원칙 — *작업 전 반드시 읽기* |
| [PLAN.md](./PLAN.md) | 12-14주 실행 계획 (Week 1 spike + Phase 0-6) |
| [NEXT.md](./NEXT.md) | 다음 세션 continuation 가이드 |

## Stack (locked 2026-05-07, Week 1 spike 결과로 contingency)

```
Desktop:   Tauri 2.0 (Rust + React + TypeScript)
캡처:       ScreenCaptureKit (system audio + mic)
STT:       Soniox streaming (BYOK, EN/KO)
LLM:       Solar Pro 3 via OpenRouter (BYOK, 128K context)
저장:       로컬 markdown
도메인:    heybartleby.com
```

## Wedge

> **"Korean ears for English audio."**
> 영어가 들리는 모든 곳 — YouTube · 컨퍼런스 · podcast · 미팅.

vs Granola/Otter/Anarlog (모두 미팅 only):
- ⭐ **시청 모드** — 영상 위 floating overlay 로 실시간 한국어 자막 (이 카테고리 안 가는 경쟁자)
- **미팅 모드** — 표준 미팅 노트 + 라이브 transcript + 후처리 한국어 요약
- **No-bot** — 봇 없음 (table stakes, 메인 wedge 아님)
- **Local data ownership** — 노트는 로컬 plain markdown
- **BYOK** — vendor lock 회피, control/compliance (cheap claim 아님)
- **Character brand** — Melville 의 바틀비, 정중하고 절제됨

## 디자인 캐릭터

**Editorial / 19c manuscript** — JetBrains Mono (필경사·타이프라이터) +
Inter / Pretendard (sans body) + Cormorant + Gowun Batang (serif) +
**neutral grayscale, accent ZERO**, OKLCH 컬러 공간, literary 75%.

상세: [DESIGN.md](./DESIGN.md) 또는
[design-system/](./design-system/bartleby/project/bartleby/) 직접 참조.

## 다음 액션

[NEXT.md](./NEXT.md) 참조 — Week 1 capture spike + 인프라 + (가능 시) customer interview.
