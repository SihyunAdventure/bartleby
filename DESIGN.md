# Bartleby — Design System

> **Source of truth**: `design-system/bartleby/project/bartleby/`
> 본 문서는 *high-level summary*. 모든 토큰·컴포넌트의 정확한 spec 은 위 폴더의 source 파일을 직접 참조.

---

## 디자인 방향 (locked 2026-05-07 by Claude Design handoff)

- **Aesthetic**: Editorial / 19세기 필사본 (manuscript) — serif, 아이보리 종이, 잉크빛, literary
- **Color mood**: Neutral mono — 진짜 회색 스케일, **accent 0** (액센트 컬러 없음)
- **Type pairing**: Mono display + Sans body (필경사 = 타이프라이터)
- **Personality**: literary 75% (Bartleby brand voice 강함)

핵심 캐릭터:
> **Mono display = scrivener's typewriter. Italic serif = Bartleby's literary voice.
> Accent = ink itself — no color, just tone.**

---

## Source 파일 구조

```
design-system/bartleby/
├── README.md                           — Claude Design 핸드오프 가이드
├── chats/
│   └── chat1.md                        — 디자인 의사결정 transcript (필독)
└── project/
    ├── Bartleby Design System.html     — 메인 디자인 시스템 페이지 (모든 컴포넌트 한눈에)
    └── bartleby/
        ├── tokens.css        (205줄)   — ⭐ 토큰 (color · type · spacing · radius · shadow)
        ├── components.css    (493줄)   — 모든 컴포넌트 스타일
        ├── page.css          (445줄)   — 페이지 레이아웃 스타일
        ├── components.jsx    (150줄)   — 컴포넌트 primitives
        ├── screens.jsx       (255줄)   — 적용 화면 (Library, Recording session)
        ├── macos-window.jsx  (187줄)   — macOS 윈도우 chrome
        ├── tweaks-panel.jsx  (568줄)   — 디자인 tweaks 패널
        └── app.jsx           (882줄)   — 전체 디자인 시스템 페이지 entry
```

---

## 폰트 스택 (확정)

| Role | EN | KR | License |
|---|---|---|---|
| **Display / chrome** | JetBrains Mono | D2Coding (mono) / Pretendard 600 | OFL ✓ |
| **Body sans** | Inter | Pretendard | OFL ✓ |
| **Body serif** | Cormorant Garamond | **Gowun Batang** ⭐ | OFL ✓ |
| **Mono (code/timestamps)** | JetBrains Mono | D2Coding | OFL ✓ |
| **UI sans (system)** | SF Pro Text | Apple SD Gothic Neo | system |

→ 모두 **SIL OFL** 라이선스로 Tauri 앱 번들에 임베딩 자유.

---

## 토큰 핵심 요약 (전체는 `tokens.css` 참조)

### 컬러 (OKLCH 색공간, chroma 0 = 모노)

**Light (warm paper-ivory)**:
```
--paper:        oklch(98.2% 0.005 85)   /* aged ivory */
--paper-2:      oklch(96.5% 0.005 85)   /* sidebar */
--paper-3:      oklch(94.0% 0.004 85)   /* hover */
--ink:          oklch(18.0% 0 0)        /* near-black ink */
--ink-2..6:     단계별 grayscale (chroma 0)
--rec:          oklch(48% 0.18 28)      /* recording vermillion (예외) */
--accent:       var(--ink)               /* accent = ink, 별도 색 없음 */
```

**Dark (ink-black)**:
```
--paper:        oklch(15.5% 0.003 250)
--ink:          oklch(96.0% 0 0)
(나머지 light 의 inversion)
```

### Type scale (4pt rhythm, modular ~1.2)

```
--t-xs:    11px  / lh 16px
--t-sm:    12px  / lh 18px
--t-base:  13px  / lh 20px
--t-md:    15px  / lh 22px
--t-lg:    18px  / lh 26px
--t-xl:    22px  / lh 30px
--t-2xl:   28px  / lh 36px
--t-3xl:   36px  / lh 44px
--t-4xl:   48px  / lh 56px
--t-5xl:   64px  / lh 72px
```

### Korean 전용 tuning

```
--kr-leading-bump: 0.08    /* line-height 보강 */
--kr-tracking:     0.005em
.ko / .ko-display / .ko-serif / .ko-mono  유틸리티 클래스
```

### Spacing (4pt base) / Radii / Shadows

전체 spec 은 `tokens.css` 참조.

---

## 디자인 시스템 페이지 — 14 섹션

`Bartleby Design System.html` 의 구조:

1. **Manifesto** — 네 가지 규칙 (디자인 철학)
2. **Color tokens** — paper / ink / status, light + dark
3. **Type scale** — full ladder + EN/KR 페어링 데모
4. **Spacing · radius · elevation**
5. **Buttons** — primary / secondary / ghost / destructive × sm/md/lg
6. **Form controls** — inputs, textarea, BYOK key field (verified/invalid), toggle, checkbox, segmented, select
7. **Recording state** — idle / listening / processing / complete + status strip + audio meter
8. **Badges & dots**
9. **Domain blocks** — meeting card, transcript utterance with translation, summary
10. **Sidebar + titlebar pattern** — macOS window chrome
11. **Voice library** — system messages, errors ("Bartleby would prefer not to."), empty + loading
12. **Applied screens** — Full Library + active Recording session window
13. **App icon** — light / dark / mono variants + dock mock
14. **Marketing** — hero, wedge cards, pricing

---

## Brand voice (캐릭터 75% literary)

### System messages
- 정중·절제, italic serif 톤
- "Bartleby has prepared your notes."
- "Bartleby would prefer not to. (마이크 권한이 없습니다.)"

### Recording states (UI 라벨)
- Idle: "Awaiting words."
- Listening: "Listening." (with vermillion dot)
- Processing: "Transcribing..."
- Complete: "Done."

### Empty / Loading
- 광기 유발 스피너 X
- 캐릭터 톤 placeholder

---

## 적용 화면 (예시)

`screens.jsx` 에서 두 가지 화면 정의:

### Library 화면
- macOS titlebar (traffic lights)
- 사이드바 (paper-2 bg)
- Main: meeting card list
- 카드: 제목 (mono), 날짜 (caption), 1줄 preview (serif italic 인용 가능)

### Recording session 화면
- 라이브 transcript (좌우 split: 한국어 / 영어 또는 단일 stream)
- Status strip 상단 (vermillion dot + timer)
- Audio meter
- 하단 control: pause / stop

→ 정확한 layout 은 `screens.jsx` + `macos-window.jsx` 참조.

---

## Tweaks panel (`tweaks-panel.jsx`)

디자인 시스템 페이지에 *interactive tweaks panel* 이 포함됨:

- **Type pairing**: Mono / Serif / Sans display 전환
- **Accent color**: 4가지 큐레이션 옵션 (default = ink)
- **Bartleby intensity slider**: terse → literary (브랜드 voice 강도)

→ 이 panel 은 *디자인 시스템 페이지 전용*. 실제 앱에는 들어가지 X (Settings 에 단순화된 일부만).

---

## 구현 가이드라인

### Tauri+React 에 옮길 때

1. **tokens.css 그대로 import** — Tauri 의 `src/styles/tokens.css` 로 복사
2. **components.css** → 컴포넌트 별 CSS modules 또는 styled 로 분리
3. **components.jsx + screens.jsx + macos-window.jsx** → 디자인 reference 로 사용, 실제 코드는 React+TS 로 재작성
4. **page.css + app.jsx** → 디자인 시스템 페이지 전용, 앱에는 X
5. **tweaks-panel.jsx** → 앱에 X (디자인 reference 만)

### 주의 사항

- **OKLCH 컬러 공간** 사용 — 최신 브라우저 지원 확인 (WebKit/Tauri 충분)
- **Korean fallback 자동 적용** — EN 클래스 그대로 써도 한글이 매칭 폰트로 렌더
- **Mixed runs 에 `kr-leading` 클래스** 적용 — 한↔영 혼용 시 line-height 조정
- **렌더하지 마세요** (README 지침) — 코드 직접 읽고 React 로 재작성

### 디자인 시스템 페이지 자체 보존 — **영구 read-only**

**`design-system/` 폴더는 절대 삭제·수정 X.** 다음 이유로 *프로젝트 lifetime 동안 보존*:

1. **누락 검증의 절대 기준** — agent 가 React 재구현 시 빠뜨린 게 있는지 비교 가능한 *유일한 진실의 원본*.
2. **새 컴포넌트 추가 시 reference** — Phase 1+ 에서 새 화면 만들 때 디자인 시스템 페이지의 패턴 다시 차용.
3. **시각 회귀 테스트** — production 코드가 디자인 의도에서 벗어났는지 정기 비교.
4. **새 팀원 온보딩** — 디자인 의도와 컨텍스트가 한 페이지에 있는 *살아있는 spec*.

### 시각 비교 워크플로우 (검증 시 사용)

```bash
# 원본 design system 페이지
cd ~/Dev/side/bartleby/design-system/bartleby/project
python3 -m http.server 8081
# → http://localhost:8081/Bartleby%20Design%20System.html

# 우리 앱 gallery
cd ~/Dev/side/bartleby && pnpm tauri dev
# → 앱 내 /__gallery 라우트
```

좌우 모니터에 띄우고 14 섹션 1:1 비교. 자세한 검증 절차는 [NEXT.md](./NEXT.md) Step 5b/5c 참조.

---

## 변경 이력

- **2026-05-07**: 초안 (sepia accent, Pretendard-only) — *invalidated*
- **2026-05-07**: Claude Design handoff bundle 적용 — *current truth*
  - JetBrains Mono display + Cormorant + Gowun Batang
  - OKLCH chroma 0 (accent ZERO)
  - 19c manuscript 방향
  - Korean 4쌍 페어링 시스템 (Pretendard / Gowun Batang / D2Coding / Apple SD Gothic Neo)
