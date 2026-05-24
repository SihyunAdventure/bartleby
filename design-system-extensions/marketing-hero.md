# Marketing Hero — Watch Mode First

> **DEPRECATED 2026-05-11 (Phase 4.5)** — Watch overlay / mode toggle 분기 자체가
> Bartleby 의 product 재정의로 제거됨. 이 문서는 historical reference 로만 보관.
> 현재 product shape 는 VISION.md / PLAN.md 참조.
> Phase 6 마케팅 hero 는 새 product shape (live recording note + YouTube URL dub) 기준으로 재작성 예정.

> Landing page (`heybartleby.com`) 의 hero composition.
> 원래 design-system §14 Marketing 은 미팅 노트 기준. *"Korean ears for English audio"* reframe 후 hero 재구성 필요.
> Phase 6 Marketing prep 시 사용.

## Hero composition

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   Korean ears for English audio.                       │ ← Cormorant italic 64px ink, kr-leading
│                                                        │
│   ━━━━                                                 │ ← divider, 64px width, --rule-strong
│                                                        │
│   영어가 들리는 모든 곳 ─                              │ ← Gowun Batang 22px ink-2
│   YouTube, podcast, conference, meeting.                │
│   Bartleby listens for you.                            │ ← Cormorant italic 22px ink-3
│                                                        │
│   [Download for Mac (Apple Silicon · Intel)]            │ ← primary button, large
│                                                        │
│   ┌─── primary visual ────────────────────────┐        │
│   │                                            │        │
│   │   [Mac desktop frame]                      │        │
│   │   ┌─────────────────────────────────┐     │        │
│   │   │  YouTube playing                 │     │        │
│   │   │  (frozen frame, Andrej talking)  │     │        │
│   │   │                                  │     │        │
│   │   │   ┌──────────────────────┐       │     │        │
│   │   │   │ ⠿ Bartleby           │       │     │ ← floating overlay
│   │   │   ├──────────────────────┤       │     │        │
│   │   │   │ "장기 컨텍스트 처리가 │       │     │        │
│   │   │   │  놀라울 정도로 잘    │       │     │        │
│   │   │   │  됩니다"             │       │     │        │
│   │   │   │ ⏵ "그리고 중요한..."  │       │     │        │
│   │   │   └──────────────────────┘       │     │        │
│   │   └─────────────────────────────────┘     │        │
│   └────────────────────────────────────────────┘        │
│                                                        │
│   30-second demo ▶                                     │ ← link 또는 embedded video
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Hero structure

1. **Headline**: *"Korean ears for English audio."*
   - Font: Cormorant Garamond italic
   - Size: var(--t-5xl) 64px (large viewport) / var(--t-4xl) 48px (medium)
   - Color: var(--ink) 100%
   - Korean alternative line below in var(--font-serif-kr) Gowun Batang
2. **Subhead**: 두 줄
   - "영어가 들리는 모든 곳 ─ YouTube · podcast · conference · meeting." (Gowun Batang 22px)
   - "Bartleby listens for you." (Cormorant italic 22px)
3. **CTA**: Primary button — "Download for Mac"
   - Subscript: "Apple Silicon + Intel · macOS 15+ · BYOK"
4. **Primary visual**: Mac desktop with YouTube + floating overlay
   - YouTube frame: frozen on a tech talk (e.g., 3Blue1Brown / Karpathy / Korean dev YouTuber)
   - Overlay: positioned bottom-left of video, real Korean caption from a real moment
   - Caption text: real example from dogfood (Andrej's "language models" talk → "언어 모델은 ...")
   - Subtle shadow + corner curl (manuscript metaphor)
5. **Demo video**: 30-second screen recording, autoplay muted
   - 시퀀스: app launch → ⌘⌃B → YouTube 시작 → overlay 자동 등장 → caption 흘러나옴 → ⌥-hold 로 EN 표시 → 영상 종료 후 Library 노트 → 끝
6. **Below fold (secondary proof)**:
   - "Also for meetings — Korean ↔ English bilingual notes."
   - Meeting mode screenshot, smaller, less prominent
   - 미팅 모드는 *suppressed demand* 메시지 ("If you've avoided English meetings...") 로 카피 강화

## Visual treatment

### 색상 (그대로 유지)
- Background: var(--paper) 약간의 노이즈 텍스처 (manuscript paper 메타포)
- Ink: var(--ink), --ink-2, --ink-3
- Accent: var(--ink) 자체 (NO sepia, NO 별도 accent — design intent)

### Typography
- 한글 + 영어 mixed: kr-leading 자동 적용
- 영어 italic Cormorant 가 brand voice carrier
- Code/timestamps: JetBrains Mono var(--font-display) — "macOS 15+" 같은 메타데이터에

### 분위기
- 19c 필사본 / editorial / 정적 (정적 ≠ 지루함, *조용한 자신감*)
- Bartleby 캐릭터 = "I would prefer not to" — 마케팅 카피도 *과장 없음*
- 수동적 캐릭터지만 visual 은 *명확함* (이중 메시지 없음)

## Voice copy candidates (hero 영역)

| Surface | Copy |
|---|---|
| H1 (영어) | *"Korean ears for English audio."* |
| H1 (한국어 alt) | *"영어가 들리는 모든 곳, 한국어로 들립니다."* |
| Subhead 1 | "영어가 들리는 모든 곳 ─ YouTube · podcast · conference · meeting." |
| Subhead 2 | *"Bartleby listens for you."* |
| CTA | "Download for Mac" |
| CTA subscript | "Apple Silicon + Intel · macOS 15+ · BYOK" |
| Demo overlay | *"watch as Bartleby translates."* |
| Below fold | "Also for meetings — Korean ↔ English bilingual notes." |
| Suppressed demand line | *"If you've been avoiding English meetings, Bartleby is your safety net."* |

## Sections below hero

(Phase 6 마케팅 build 시 추가):

1. **Wedge cards** (3장):
   - 🎧 *No bots* — Your meeting stays private
   - 🌏 *Korean-first* — built for Korean ears, not retrofitted
   - 📝 *Markdown forever* — your notes outlive any subscription
2. **How it works** (3-step):
   - Play any English audio
   - Bartleby listens via your Mac and sends data only to your BYOK providers
   - Korean captions appear in a floating window. Saved as markdown.
3. **Pricing** (간단):
   - v1 free + waitlist
   - BYOK explained: "Use your own Soniox + Upstage keys. We charge nothing in v1."
4. **Below fold meeting demo** + 30-second meeting screencast
5. **Footer**: links, source-available license badge (TBD), GitHub, Twitter, contact

## Accessibility / SEO

- All text in semantic HTML (no SVG-only headings)
- Korean meta description for ko-KR audience
- English meta description for en audience  
- Hero visual: real screenshots, not stock photos
- Demo video: captions on (자기 자신의 자막!), descriptive transcript

## Open questions
- Hero 의 primary visual 이 *static screenshot* vs *autoplay loop* — autoplay 가 conversion 좋지만 페이지 무거움. 타협: poster image + click-to-play
- Korean H1 alt 와 English H1 같이 보이게 vs language-detection 으로 한쪽만
- "30-second demo" 가 inline 또는 modal — A/B test (Phase 6)
