# Bartleby

> "I would prefer not to take notes." — Let Bartleby.

Cloud-powered Mac AI 미팅 노트. 봇 없음. 한국어 first.

## 빠른 컨텍스트

- **카테고리**: macOS 미팅 노트 비서 (Granola/Anarlog 류)
- **타겟**: 한↔영 bilingual 미팅 자주 하는 한국 지식 노동자
- **첫 사용자**: Sihyun (본인 dogfood)
- **상태**: 계획 단계 완료, Phase 0 (UI shell) 시작 직전
- **타겟 출시**: 2026-07-09 주 (8주 후)

## 문서 구조

| 파일 / 폴더 | 내용 |
|---|---|
| [VISION.md](./VISION.md) | 제품 비전, 포지셔닝, wedge, 카피 |
| [DESIGN.md](./DESIGN.md) | 디자인 시스템 high-level summary (실제 spec 은 ↓) |
| [design-system/](./design-system/) | ⭐ 디자인 시스템 **source of truth** (Claude Design handoff, 영구 read-only) |
| [PRINCIPLES.md](./PRINCIPLES.md) | ⭐ 디자인 구현 원칙 — *작업 전 반드시 읽기* |
| [PLAN.md](./PLAN.md) | 8주 실행 계획 (Phase 0-6) |
| [NEXT.md](./NEXT.md) | 다음 세션 continuation 가이드 |

## Stack (locked 2026-05-07)

```
Desktop:   Tauri 2.0 (Rust + React + TypeScript)
STT:       Soniox streaming (BYOK)
LLM:       Solar Pro 3 via OpenRouter (BYOK)
           - 번역 + 요약 단일 모델, 128K context
저장:       로컬 markdown
도메인:    heybartleby.com
```

## Wedge (vs Granola, Otter, Anarlog)

- **No-bot** — 미팅에 봇 안 들어감
- **Korean-first** — 한↔영 양방향 SOTA
- **BYOK** — 사용자 자기 키, 비용 1/3
- **Character brand** — Melville 의 바틀비, 정중하고 절제됨
- **Local data ownership** — 노트는 로컬 plain markdown

## 디자인 캐릭터

**Editorial / 19c manuscript** — JetBrains Mono (필경사·타이프라이터) +
Inter / Pretendard (sans body) + Cormorant + Gowun Batang (serif) +
**neutral grayscale, accent ZERO**, OKLCH 컬러 공간, literary 75%.

상세: [DESIGN.md](./DESIGN.md) 또는
[design-system/](./design-system/bartleby/project/bartleby/) 직접 참조.

## 다음 액션

[NEXT.md](./NEXT.md) 참조.
