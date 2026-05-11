# Bartleby — Design System Extensions

> 영구 read-only 인 `design-system/` 의 *연장선*.

## 2026-05-11 Product 재정의 이후 상태 (Phase 4.5)

Bartleby 가 Watch overlay + mode toggle 이중 분기에서
**단일 dock note taker** (live recording 노트 + YouTube URL 더빙) 로 재정의됨.
이 폴더의 대부분 spec 은 Watch overlay 가정 위에 씌어졌으므로 deprecate 됨.

| 파일 | 상태 |
|---|---|
| `overlay.md` | ❌ DEPRECATED — Watch overlay 제거됨 |
| `mode-switch.md` | ❌ DEPRECATED — Watch/Meeting 모드 전환 제거됨 |
| `permission.md` | ⚠️ PARTIAL DEPRECATED — Screen Recording/Mic backend 인프라 유지, Watch UX 가정 제거됨 |
| `marketing-hero.md` | ❌ DEPRECATED — Watch-first hero 구성 제거됨. Phase 6 새 hero 재작성 예정 |
| `settings.md` | ⚠️ PARTIAL DEPRECATED — Tab 2 Watch Mode 섹션 제거됨. Keys/Storage/Shortcuts/About 유효 |

모든 deprecated 파일은 historical reference 로 보관. 현재 product shape 는 **VISION.md / PLAN.md** 참조.

## 관계

`design-system/bartleby/project/bartleby/` 는 Claude Design 핸드오프 bundle, **영구 read-only** (PRINCIPLES.md §0).
이 폴더는 그 source-of-truth *위에* 추가 surface 의 spec.

**불변 (design-system/ 의 sacred values 그대로 상속)**:
- OKLCH chroma 0 (accent = ink)
- 폰트 5종 stack (JetBrains Mono · Inter · Pretendard · Cormorant · Gowun Batang · D2Coding)
- 토큰 (`tokens.css` 의 `--paper-*`, `--ink-*`, `--rec`, `--s-*`, `--r-*`, `--t-*`)
- Bartleby literary character voice (75%, italic serif for personality)
- Korean fallback (`.ko`, `.ko-display`, `.ko-serif`, `.ko-mono`, `--kr-leading-bump`)

**Korean typography exception (여전히 유효)**:
- Live 표면 (라이브 transcript) → Pretendard sans
- Static 표면 (notes, summaries, voice cards, marketing) → Gowun Batang
- 자세히는 PRINCIPLES.md §4.2.1 참조.

## v2 design-system 핸드오프 트리거

새 컴포넌트 패턴이 *기존 design-system 에서 차용 불가능* 한 경우
정식 Claude Design 새 핸드오프를 받아 `design-system-v2/` 로 격상.
