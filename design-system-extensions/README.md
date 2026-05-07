# Bartleby — Design System Extensions

> 영구 read-only 인 `design-system/` 의 *연장선*. 
> Phase 0 designer agent 가 reference 로 사용.

## 관계

`design-system/bartleby/project/bartleby/` 는 Claude Design 핸드오프 bundle, **영구 read-only** (PRINCIPLES.md §0).
이 폴더는 그 source-of-truth *위에* dual-mode reframe (시청 + 미팅) 으로 추가된 surface 의 spec.

**불변 (design-system/ 의 sacred values 그대로 상속)**:
- OKLCH chroma 0 (accent = ink)
- 폰트 5종 stack (JetBrains Mono · Inter · Pretendard · Cormorant · Gowun Batang · D2Coding)
- 토큰 (`tokens.css` 의 `--paper-*`, `--ink-*`, `--rec`, `--s-*`, `--r-*`, `--t-*`)
- Bartleby literary character voice (75%, italic serif for personality)
- Korean fallback (`.ko`, `.ko-display`, `.ko-serif`, `.ko-mono`, `--kr-leading-bump`)

**확장된 surface (이 폴더가 채움)**:
- `overlay.md` — Watch mode 의 floating overlay window (영상 위 라이브 자막)
- `settings.md` — Settings UI (BYOK key + retention + overlay prefs + shortcut)
- (TODO v1.5+) `onboarding.md`, `marketing-hero.md`, `voice-watch-matrix.md`

**예외 결정 (이 폴더에서만 새로 박힘)**:
- 시청 모드 overlay 의 라이브 자막은 **Pretendard sans** (Gowun Batang 아님 — 14-16px live caption rate 에서 serif 가독성 저하).
- Gowun Batang 은 *static* 표면 (notes, summaries, voice cards, marketing) 에만.
- 자세히는 PRINCIPLES.md §4.2 의 *Korean typography exception note* 참조.

## v2 design-system 핸드오프 트리거

이 폴더에 spec 이 3개 이상 쌓이거나, 새 컴포넌트 패턴이 *기존 design-system 에서 차용 불가능* 한 경우
정식 Claude Design 새 핸드오프를 받아 `design-system-v2/` 로 격상.
그 시점까지 본 폴더가 임시 source-of-truth.
