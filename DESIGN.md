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

## 앱 Surface 구조 (Phase 4.5 기준)

단일 dock 앱. 별도 floating window 없음.

```
┌─────────────────────────────────────────────────────────┐
│ [macOS titlebar]                                        │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Sidebar     │  Main area                               │
│  (240px)     │                                          │
│              │  - Library (note list, default)          │
│  Bartleby    │  - Recording session (live)              │
│  wordmark    │  - Note detail (after session)           │
│              │  - Settings (/settings)                  │
│  Library nav │                                          │
│  (note list) │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Library

- macOS titlebar (traffic lights)
- 사이드바 (paper-2 bg) — 날짜 그룹별 note list
- Note card: 제목 (mono), 날짜 (caption), 1줄 preview (serif italic)
- source 별 badge: `meeting` / `url` / `file`

### Recording session (live)

- 실시간 transcript (KO|EN split 또는 KO-only)
- Status strip 상단 (vermillion dot + timer)
- Audio meter
- 하단 control: pause / stop

### Note detail

source 에 따라 default output 분기:
- `meeting` → Summary (TL;DR + Decisions + Action Items + Key Quotes) primary
- `url` → Dub output (Listen 경로, Phase 5+) primary, transcript secondary
- 모든 타입: Read (transcript + 번역), Skim (요약) 탭 가능

---

## Brand voice (캐릭터 75% literary)

### System messages
- 정중·절제, italic serif 톤
- *"Bartleby has prepared your notes."* (recording 후)
- *"Bartleby has prepared your translation."* (URL dub 후)
- *"Bartleby would prefer not to. (마이크 권한이 없습니다.)"* (error)

### Recording states (UI 라벨)
- Idle: *"Awaiting words."*
- Listening: *"Listening."* (with vermillion dot)
- Processing: *"Transcribing..."*
- Complete: *"Done."*

### Empty / Loading
- 광기 유발 스피너 X
- 캐릭터 톤 placeholder: *"Bartleby has not yet taken notes. Record something."*

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

### 시각 비교 워크플로우

```bash
# 원본 design system 페이지
cd ~/Dev/side/bartleby/design-system/bartleby/project
python3 -m http.server 8081
# → http://localhost:8081/Bartleby%20Design%20System.html

# 우리 앱 gallery
cd ~/Dev/side/bartleby && pnpm tauri dev
# → 앱 내 ?gallery URL 분기
```

---

## 변경 이력

- **2026-05-07**: 초안 (sepia accent, Pretendard-only) — *invalidated*
- **2026-05-07**: Claude Design handoff bundle 적용 — *current truth*
  - JetBrains Mono display + Cormorant + Gowun Batang
  - OKLCH chroma 0 (accent ZERO)
  - 19c manuscript 방향
  - Korean 4쌍 페어링 시스템 (Pretendard / Gowun Batang / D2Coding / Apple SD Gothic Neo)
- **2026-05-07 autoplan Phase 2**: design-system-extensions/ 생성 (Watch overlay + Settings + Mode switch)
- **2026-05-11 Phase 4.5**: Watch overlay / mode toggle 제거 → single-surface redesign.
  Applied screens 을 Library + Recording session + Note detail 로 재정의.

## Design system 노트

### tokens.css L15 의 "Nanum Myeongjo" 주석 (stale)

[tokens.css L15](./design-system/bartleby/project/bartleby/tokens.css#L15) 의 Korean serif companion 주석은 "Nanum Myeongjo" 로 적혀 있음. 하지만 *실제 font-family fallback chain* (L23) 은 Cormorant → **Gowun Batang** → Nanum Myeongjo → ... 순서로 Gowun Batang 이 한국어 우선.

DESIGN.md 의 ⭐ Gowun Batang 결정이 source-of-truth. tokens.css L15 주석은 *historical* — design-system 폴더는 영구 read-only 라 주석 fix 안 함. 이 노트가 명확화 함.

→ 한 줄: **한국어 serif = Gowun Batang.** 다른 폰트로 substitute 금지 (PRINCIPLES §4.2 Sacred Values).
