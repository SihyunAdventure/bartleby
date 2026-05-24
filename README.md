# Bartleby

> "I would prefer not to take notes." — Let Bartleby.

단일 dock macOS 앱. 영어 / 한국어 라이브 미팅에서
**transcript + 요약 노트**. 봇 없음. 한국어 first. BYOK.

## 빠른 컨텍스트

- **카테고리**: macOS 라이브 미팅 → transcript + summary note
- **단일 surface**: dock Finder-like 앱. Library + Recording (live transcript + summary panel)
- **타겟**: 매일 영어/한국어 미팅이 섞여 있는 한국 전문가
- **첫 사용자**: Sihyun (본인 dogfood)
- **상태**: Phase 6 dogfood build — capture infra + Soniox STT + Upstage Solar Pro 3 번역/최종 노트 + Library/Recording UI + SQLite persistence + 번역 toggle.
- **타겟 출시**: 2026-08-13 ~ 2026-08-27 (12-14주)

## Sibling product — Rehear

YouTube URL → 한국어 (또는 다른 언어) 더빙 영상 재생성 은 별개 sibling product **Rehear** (`~/Dev/side/rehear/`) 로 분리됨. Rehear 가 Bartleby 의 capture/STT/translate/summary 코드를 fork 해서 시작, 별개 evolution. 두 product 의 mental model 이 다름 — Bartleby = productivity (미팅 노트), Rehear = consumption (영상 시청).

## 문서 구조

| 파일 / 폴더 | 내용 |
|---|---|
| [VISION.md](./VISION.md) | 제품 비전, 포지셔닝, wedge |
| [DESIGN.md](./DESIGN.md) | 디자인 시스템 high-level summary |
| [design-system/](./design-system/) | ⭐ 디자인 시스템 **source of truth** (Claude Design handoff, 영구 read-only) |
| [design-system-extensions/](./design-system-extensions/) | Phase 0 surface spec (일부 Phase 4.5 에서 deprecate 마킹됨) |
| [PRINCIPLES.md](./PRINCIPLES.md) | ⭐ 디자인 구현 원칙 — *작업 전 반드시 읽기* |
| [GALLERY.md](./GALLERY.md) | 섹션 매핑 표 + ship/polish gate + 검증 워크플로우 |
| [MODELS.md](./MODELS.md) | 공개 빌드에서 노출하는 STT/LLM 모델 surface |
| [PLAN.md](./PLAN.md) | Phase 1-7 실행 계획 |
| [NEXT.md](./NEXT.md) | 내부 continuation log — 공개 모델 surface 는 MODELS.md 기준 |

## Stack

```
Desktop:   Tauri 2.0 (Rust + React + TypeScript)
캡처:       ScreenCaptureKit (system audio, mic deferred)
STT:       Soniox stt-rt-v4 streaming (BYOK, EN/KO multilingual auto-detect)
LLM:       Upstage solar-pro3 direct API (BYOK, translation + final note)
Local ML:  none bundled, none auto-installed
저장:       SQLite via tauri-plugin-sql + local audio segments
도메인:    heybartleby.com
```

## Wedge

> **"Korean ears for English (and Korean) meetings."**
> 영어 / 한국어 라이브 미팅 — 봇 없이, 로컬에서, 한국어 transcript + 요약.

vs Granola / Otter / Fireflies:
- **No-bot** — 상대방이 봇을 인식하게 만들지 않음
- **한국어 first** — 한국어 native transcript + 요약 (자동 언어 분기)
- **Local data ownership** — 노트는 로컬 storage (BYOK keys 외 cloud X)
- **BYOK** — vendor lock 회피, Keychain 영구 저장
- **No hidden models** — OpenRouter/Whisper/Ollama/GPT/Claude/Gemini 는 공개 surface 아님
- **Character brand** — Melville 의 Bartleby, 정중하고 절제됨

## 디자인 캐릭터

**Editorial / 19c manuscript** — JetBrains Mono (필경사·타이프라이터) +
Inter / Pretendard (sans body) + Cormorant + Gowun Batang (serif) +
**neutral grayscale, accent ZERO**, OKLCH 컬러 공간, literary 75%.

상세: [DESIGN.md](./DESIGN.md) 또는 [design-system/](./design-system/bartleby/project/bartleby/) 직접 참조.

## 다음 액션

[MODELS.md](./MODELS.md) 기준으로 공개 모델 surface 를 유지하고, release plan 은 DMG/signing/web 구조를 Copy & Taste 방식으로 정리한다.
