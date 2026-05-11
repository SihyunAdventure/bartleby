# Bartleby

> "I would prefer not to listen in English." — Let Bartleby.

단일 dock Mac 앱. 영어 라이브 미팅에서
**한국어 transcript + 요약 노트**. 봇 없음. 한국어 first. BYOK.

## 빠른 컨텍스트

- **카테고리**: macOS 영어 audio → Korean understanding layer
- **두 모드**: 시청 모드 (영상 위 floating overlay 라이브 자막) + 미팅 모드 (sidebar 노트 view)
- **타겟**: 매일 영어 콘텐츠 보는 한국 개발자/학습자 + 영어 미팅 능력 필요한 한국 전문가
- **첫 사용자**: Sihyun (본인 dogfood — 매일 영어 YouTube 1h+)
- **상태**: Day 1-13 ✅ — capture infra (1h stable / 720 seg / drop 0) + Phase 0 entry (Section §00 §01 + tokens + 6 폰트 embedded + production UI dressed). 다음: Phase 2 STT (Soniox + Solar Pro 3, wedge 검증).
- **타겟 출시**: 2026-08-13 ~ 2026-08-27 (12-14주)

## 문서 구조

| 파일 / 폴더 | 내용 |
|---|---|
| [VISION.md](./VISION.md) | 제품 비전, 포지셔닝, wedge, 카피 |
| [DESIGN.md](./DESIGN.md) | 디자인 시스템 high-level summary (실제 spec 은 ↓) |
| [design-system/](./design-system/) | ⭐ 디자인 시스템 **source of truth** (Claude Design handoff, 영구 read-only) |
| [design-system-extensions/](./design-system-extensions/) | dual-mode reframe 후 추가 5 surface spec (overlay / mode-switch / settings / permission / marketing-hero) |
| [PRINCIPLES.md](./PRINCIPLES.md) | ⭐ 디자인 구현 원칙 — *작업 전 반드시 읽기* (ship/polish gate split 포함) |
| [GALLERY.md](./GALLERY.md) | 19 섹션 매핑 표 + ship/polish Gate + 검증 워크플로우 |
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

> **"Korean ears for English meetings."**
> 영어 라이브 미팅 — 봇 없이, 로컬에서, 한국어로.

vs Granola/Otter/Anarlog:
- **No-bot** — 상대방이 봇을 인식하게 만들지 않는다
- **한국어 first** — 한국어 transcript + 요약 (후처리 조잡 X)
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

[NEXT.md](./NEXT.md) 참조 — Day 14 = Phase 2 STT entry. Lane B (Soniox / OpenRouter API key) 사용자 손 + Soniox spike binary (wedge 검증).
