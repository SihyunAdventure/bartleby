# Bartleby — Next Session Continuation

> 다음 세션에서 이 파일부터 읽고 진행.
> 마지막 세션: 2026-05-07 — autoplan CEO review + reframe ("Korean ears for English audio") + Week 1 prep

---

## 현재 상태 (2026-05-07 종료 시점)

✅ 완료:
- Brand · 도메인 · stack · 디자인 시스템 (Claude Design handoff bundle, design-system/)
- VISION/DESIGN/PRINCIPLES/PLAN 작성
- **autoplan CEO review** — codex + critic dual voice, 6/9 critical 발견
- **Reframe 결정** — 미팅 only → 콘텐츠 + 미팅 dual mode
- **Timeline 연장** — 8주 → 12-14주
- **Sequence swap** — UI 먼저 → capture spike 먼저
- 첫 git commit (이 repo)

⏳ 다음 세션 (Week 1):
- **Phase 2/3 autoplan review** 진행 (Design + Eng) — 새 reframe plan 위에서
- Week 1 capture spike (~3-5일)
- 인프라 (도메인 + GitHub + Twitter + Soniox + OpenRouter + Apple Developer) ~1시간
- Customer interview 5명 (가능 시)

---

## 다음 세션 시작 시 — 정확한 순서

### Step 1: 컨텍스트 로드 (~5분)

```
cd ~/Dev/side/bartleby
```

읽을 파일 (반드시 순서대로):
1. `README.md` — 빠른 오리엔테이션
2. `VISION.md` — 제품 비전·포지셔닝
3. **`PRINCIPLES.md`** ⭐ — 디자인 구현 원칙 (작업 전 필독, 누락 방어)
4. `DESIGN.md` — 디자인 시스템 high-level summary
5. `PLAN.md` — Phase 0-6 8주 계획

### Step 2: 심층 계획 review (`/autoplan`)

✅ **2026-05-07 1차 세션 완료 — 3 phase 모두**.
- Phase 1 (CEO): codex + critic dual voice → 6/9 critical → "Korean ears for English audio" reframe.
- Phase 2 (Design): codex + designer agent → 9/11 confirmed → `design-system-extensions/` 생성 (overlay + settings spec).
- Phase 3 (Eng): codex + architect agent → 13/14 confirmed → spike scope 확장 + storage schema + STT protocol + SessionSupervisor.
- 결과 반영해서 PLAN.md / VISION.md / PRINCIPLES.md / README.md / `design-system-extensions/*` 모두 수정됨 (commit 참조).
- ⏳ 미반영 minor (다음 세션 자동 적용 가능): D2/D3/D5/D6 design copy + E5(DRM hint)/E6(audio router 코드)/E8(permission lifecycle)/E9(test fixture)/E10(Soniox 벤치마크 protocol)/E11(tokens.css L15 Nanum 주석 노트).

→ 다음 세션은 *Week 1 capture spike 실행* 단계. autoplan 재호출 불필요 (Phase 0-3 모두 완료).

### Step 2.5: ⭐ Capture spike (Week 1 새 sequence)

> autoplan 결정: UI 보다 capture 검증 먼저. 자세한 spike 흐름 → PLAN.md §7

3-5일 Tauri+Rust+ScreenCaptureKit 검증:
- [ ] `pnpm create tauri-app .`
- [ ] `screencapturekit-rs` (또는 fork) binding
- [ ] **Anarlog (`fastrepl/anarlog`) 코드 정독** — 작동 패턴 차용
- [ ] 1시간 YouTube 영상 system audio 캡처 + .opus 저장
- [ ] mic + system audio mixing
- [ ] 권한 요청 플로우

**Spike 결정 gate** (PLAN.md §7 의 contingency 표 참조):
- ✅ 1시간 stable → Tauri 강행, Phase 0 (Step 4-5) 진입
- ⚠️ system audio 만 불안정 → Tauri UI + Swift sidecar
- ❌ ScreenCaptureKit Rust 실패 → Native SwiftUI pivot (디자인 시스템 SwiftUI 재작성)

### Step 3: 도메인·계정 인프라 (~1시간, capture spike 와 병렬)

- [ ] heybartleby.com 결제 (Cloudflare 또는 Porkbun, ~$11)
- [ ] GitHub org `heybartleby` 생성, repo `bartleby` 비공개
- [ ] Twitter/X `@heybartleby` 핸들 선점
- [ ] Soniox 가입, API 키
- [ ] OpenRouter 가입, API 키 + $5 충전
- [ ] Apple Developer 계정 신청 ($99/년, 승인 1주)

### Step 4: Tauri 프로젝트 부트스트랩 (~1-2시간)

```bash
cd ~/Dev/side/bartleby
pnpm create tauri-app .  # 현재 디렉토리에 생성
# Frontend: React + TypeScript
# Package manager: pnpm
# Vite
```

추가 의존성:
```bash
pnpm add @fontsource-variable/pretendard lucide-react
pnpm add -D tailwindcss@next @tailwindcss/vite
```

### Step 5: 디자인 시스템 코드 구축 — `designer` 에이전트

> **중요**: 디자인 시스템은 이미 Claude Design 으로 만들어져 있음.
> `~/Dev/side/bartleby/design-system/bartleby/project/bartleby/` 가 source of truth.
> designer 에이전트는 *새로 디자인 만드는 게 아니라*, 기존 디자인을 **Tauri+React+TS 로 재구현** 만 하면 됨.

**`designer` 에이전트에게 다음과 같이 위임**:

```
배경:
- 프로젝트 루트: ~/Dev/side/bartleby
- 디자인 시스템 source-of-truth: design-system/bartleby/project/bartleby/
- 우리 앱 source: src/ (Tauri+React+TS, pnpm)

먼저 읽을 것 (반드시 순서대로):
1. design-system/bartleby/README.md  — 핸드오프 가이드
2. design-system/bartleby/chats/chat1.md  — 디자인 의사결정 transcript
3. design-system/bartleby/project/bartleby/tokens.css  — ⭐ 토큰 (color/type/space/radius/shadow)
4. design-system/bartleby/project/bartleby/components.css  — 컴포넌트 스타일 전체
5. design-system/bartleby/project/bartleby/components.jsx  — 컴포넌트 구조
6. design-system/bartleby/project/bartleby/screens.jsx  — 적용 화면 (Library + Recording)
7. design-system/bartleby/project/bartleby/macos-window.jsx  — macOS chrome
8. DESIGN.md  — high-level 요약

작업:
1. tokens.css 를 src/styles/tokens.css 로 복사 (그대로, OKLCH 유지)
2. 폰트 임베딩 (모두 OFL, Tauri 번들 자유):
   - JetBrains Mono Variable
   - Inter Variable
   - Pretendard Variable
   - Cormorant Garamond
   - Gowun Batang (KR serif, 한국 디자이너 표준)
   - D2Coding (KR mono)
   - @fontsource-variable/* 패키지 활용 또는 self-host
3. Tailwind 4 설정에 OKLCH 토큰 매핑 → tailwind.config.ts
4. 다크모드: data-theme="dark" 토글 + prefers-color-scheme 자동
5. 컴포넌트 primitives 재구현 (React+TS, components.jsx 가 reference):
   - <Button> (primary/secondary/ghost/destructive × sm/md/lg)
   - <Input> + 특수: <BYOKKeyInput> (verified/invalid 상태)
   - <Textarea>
   - <Toggle> + <Checkbox> + <Segmented> + <Select>
   - <Card>, <MeetingCard>, <TranscriptUtterance>, <SummaryBlock>
   - <Sidebar> + <SidebarItem>
   - <Titlebar> (macOS traffic lights 포함)
   - <RecordingIndicator> (idle/listening/processing/complete)
   - <AudioMeter>, <StatusStrip>
   - <Badge>, <Dot>
   - <Toast>, <Modal>
   - <EmptyState> (캐릭터 톤)
6. Korean fallback 검증:
   - .ko / .ko-display / .ko-serif / .ko-mono 유틸 적용
   - 한↔영 혼용 텍스트에 .kr-leading 적용
7. 컴포넌트 갤러리 페이지 (/__gallery 라우트, dev only):
   - 모든 primitives + 적용 화면 (Library, Recording session)
   - 다크모드 토글
   - DESIGN.md 의 14 섹션 구조 그대로 (manifesto, tokens, type, spacing, buttons, forms, recording, ...)

스타일:
- design-system 의 components.css / page.css 를 참고 reference 로 사용
- 단 React 컴포넌트로 적절히 분해 (CSS modules 또는 vanilla CSS, styled-components 는 X)
- Tailwind utility 와 token 기반 CSS variables 혼용 OK

출력:
- src/styles/tokens.css, src/styles/globals.css
- src/components/ui/* (각 컴포넌트 별 폴더)
- src/components/gallery/* (갤러리 페이지 섹션)
- src/hooks/use-theme.ts (다크모드)
- src/lib/* (유틸)
- pnpm tauri dev 실행 시 /__gallery 접속해서 모든 컴포넌트 확인 가능

주의:
- design-system/ 폴더는 read-only reference. 거기 파일은 수정 X
- design-system 의 tweaks-panel.jsx 는 앱에 포함 X (디자인 reference 전용)
- design-system 의 디자인 시스템 페이지를 *브라우저로 렌더하지 말 것* — 코드 직접 읽기
- accent color = ink 자체, 별도 accent 컬러 추가 금지 (디자인 의도)
- 캐릭터 강도 75% literary — 시스템 메시지·에러에 italic serif Bartleby voice 살리기
```

검증:
- `pnpm tauri dev` 실행 → `/__gallery` 페이지 접속
- 라이트/다크 모드 양쪽에서 모든 컴포넌트 확인
- 폰트·컬러·spacing 이 design-system source 와 시각적으로 일치하는지 비교
- 한국어 텍스트 렌더링 (Pretendard / Gowun Batang / D2Coding) 확인

### Step 5b: 누락 검증 (designer 작업 직후 필수)

**design-system/ 의 14 섹션 vs 우리 gallery 1:1 매핑 표 작성**

designer agent 의 마지막 deliverable 로 다음 표를 채워서 보고:

| # | design-system 섹션 | 우리 gallery 위치 | 상태 | 비고 |
|---|---|---|---|---|
| 1 | Manifesto (4 rules) | /__gallery#manifesto | ☐ | |
| 2 | Color tokens (light + dark) | /__gallery#colors | ☐ | |
| 3 | Type scale (EN + KR pairing) | /__gallery#typography | ☐ | |
| 4 | Spacing · radius · elevation | /__gallery#spacing | ☐ | |
| 5 | Buttons (4 × 3 sizes × states) | /__gallery#buttons | ☐ | |
| 6 | Form controls (8종) | /__gallery#forms | ☐ | BYOK key field 포함 |
| 7 | Recording state (4 phases) | /__gallery#recording | ☐ | audio meter 포함 |
| 8 | Badges & dots | /__gallery#badges | ☐ | |
| 9 | Domain blocks (meeting/transcript/summary) | /__gallery#domain | ☐ | |
| 10 | Sidebar + titlebar pattern | /__gallery#window | ☐ | macOS chrome |
| 11 | Voice library (system msgs, errors, empty, loading) | /__gallery#voice | ☐ | "Bartleby would prefer not to." |
| 12 | Applied screens (Library + Recording) | /__gallery#screens | ☐ | 앱 실제 라우트로도 사용 |
| 13 | App icon (light/dark/mono + dock mock) | /__gallery#icon | ☐ | |
| 14 | Marketing (hero, wedge, pricing) | /__gallery#marketing | ☐ | 앱 외부지만 디자인 시스템 일부. **Watch 모드 hero 로 reframe** (split: YouTube + overlay, meeting 은 secondary) |
| 15 | **WatchOverlay** — drag/resize/opacity, 7 states (idle/listening/captioning/translating/reconnecting/drm-blocked/permission-denied/complete), KO Pretendard caption | /__gallery#overlay | ☐ | spec: `design-system-extensions/overlay.md`. NSPanel-equivalent 검증 (Week 1 spike) |
| 16 | **Mode switch widget** — Segmented control sidebar 상단, 200ms cross-fade, active session 시 confirm modal | /__gallery#mode-switch | ☐ | `design-system/components.css` 의 Segmented 재사용. 라우팅 `/live/watch` ↔ `/live/meeting` |
| 17 | **Settings UI** — 5 tabs (Keys/Modes/Storage/Shortcuts/About), KeyInput verified/invalid 상태, BYOK 키 Keychain 저장 | /__gallery#settings | ☐ | spec: `design-system-extensions/settings.md`. 단축키 customize 가능 |
| 18 | **Onboarding flow** — 3 steps (API 키 → 권한 → 첫 watch demo) | /__gallery#onboarding | ☐ | TODO design-system-extensions/onboarding.md (v1.5) |
| 19 | **Permission / DRM rejection** — Screen Recording / Microphone 거부, DRM-blocked detection (10-20s RMS < -60dBFS), Settings.app deeplink | /__gallery#permission | ☐ | Voice copy 일관 유지 ("Bartleby would prefer not to. (...)") |

**각 row 가 ✅ 가 아니면 Phase 0 미완료**. 표 14→19 row 로 확장 (autoplan 2026-05-07).

### Step 5c: 시각 비교 워크플로우 (사용자가 직접 검증)

designer agent 작업 끝난 후, *사용자가* 시각 비교로 최종 검증:

```bash
# 터미널 1: 원본 design system 페이지 띄우기
cd ~/Dev/side/bartleby/design-system/bartleby/project
python3 -m http.server 8081
# 브라우저에서: http://localhost:8081/Bartleby%20Design%20System.html

# 터미널 2: 우리 앱 gallery 띄우기
cd ~/Dev/side/bartleby
pnpm tauri dev
# 앱 내 /__gallery 라우트
```

모니터 좌우에 띄우고 **section by section 시각 비교**:
- 각 섹션의 컴포넌트가 다 있는가?
- 색·간격·폰트가 일치하는가?
- hover / focus / disabled 등 상태가 일치하는가?
- voice copy ("Bartleby would prefer not to." 등) 가 정확한가?
- 응용 화면 (Library, Recording) 의 layout 디테일까지 매칭되는가?

**불일치·누락 발견 시 → designer agent 한테 spot fix 위임**:
```
designer 에게:
"/__gallery#forms 에서 BYOK key field 의 verified 상태 (체크 아이콘 + 옅은 ok 색)
 가 누락됨. design-system/bartleby/project/bartleby/components.css 의
 .input-key.verified 클래스 정의를 따라 추가해줘."
```

이 검증·보정 사이클이 **Phase 0 의 진짜 acceptance criteria**.

### Step 6: 사이드바 + 메인 레이아웃 (Phase 0 Day 4-5)

디자인 시스템 검증 후 진행:
- App shell (사이드바 240px + 가변 main)
- 라우팅 (Library / Live / Note Detail / Settings)
- 사이드바 컴포넌트 (Today / Yesterday / This Week 그룹)
- 단축키 핸들러
- Empty state

### Step 7: 더미 데이터로 Library + Note Detail (Phase 0 Day 6-7)

- 더미 미팅 5-10개로 Library 표시
- Note Detail UI (TL;DR + Decisions + Action Items + Transcript)
- Markdown rendering
- 한국어/영어 transcript 토글

→ Phase 0 acceptance: 클릭 가능한 UI shell, 미팅 캡처는 X.

---

## 핵심 결정사항 (변경 시 PLAN.md / VISION.md 업데이트)

```
Brand:      Bartleby
Domain:     heybartleby.com
Stack:      Tauri 2.0 (Rust + React + TS) — Week 1 spike 결과로 contingency
            Tauri Updater plugin (Sparkle 제거, autoplan 결정)
최소 OS:    macOS 15 Sequoia (autoplan: ScreenCaptureKit mic feature 호환성)
STT:        Soniox streaming (BYOK, EN/KO 양방향). Protocol: monotonic seq# + audio-clock + 30s ring reconnect + bounded queue 8
LLM:        Solar Pro 3 via OpenRouter (BYOK, 128K context). Order-preserving translation, batched 2-3 finals
Storage:    sessions/{uuid}/{note.md, audio.opus, transcript.jsonl, events.jsonl}
            bartleby://{uuid} 내부 URI (사용자가 .md 이동해도 audio link 살아있음)
First user: 본인 (Sihyun) — 매일 영어 YouTube 1h+ 시청
Wedge:      Korean ears for English audio — 시청 모드 (YouTube/podcast/컨퍼런스 라이브 자막) + 미팅 모드 dual mode
Layout:     사이드바 240px + 가변 main + floating overlay (시청 모드)
모드:       시청 모드 (system audio only, overlay) ↔ 미팅 모드 (mic+system, sidebar)
모드 전환:  Sidebar 상단 Segmented + 단축키 ⌘⌃B (Watch) / ⌘⌃M (Meeting), Settings customize
Font:       JetBrains Mono + Inter + Pretendard + Cormorant Garamond + Gowun Batang + D2Coding (모두 OFL)
Typography: live caption = Pretendard (sans), static notes/summaries = Gowun Batang (serif). PRINCIPLES §4.2.1
Color:      OKLCH chroma 0 (paper-ivory + ink, accent = ink itself, ZERO accent color)
Timeline:   12-14주 (8주에서 연장, autoplan 결정)
Sequence:   Week 1 capture spike → Week 2-3 Phase 0/1 → Week 4 STT → ... (UI 보다 capture 먼저)
검증 표:    14 → 19 섹션 (NEXT Step 5b, +5 rows: overlay/mode-switch/settings/onboarding/permission)
SessionFSM: 12 states (Idle/PermissionNeeded/Starting/Capturing/STTConnecting/Live/
            Reconnecting/Degraded/Stopping/Saving/Complete/Error)
```

> 2026-05-07 autoplan reframe: "Granola for Korean (미팅 only)" → "Korean ears for English audio (콘텐츠 + 미팅 dual mode)".
> 사용자 daily reality (영어 YouTube 1h+/일, 미팅은 영어 능력 부족으로 suppressed) 기반.

---

## 변경 가능 / 의문점 (다음 세션에서 review)

- 첫 100명 segment 가설 검증 (창업자·프리랜서·매니저)
- 가격 모델 ($5/월 flat?)
- 오픈소스 vs source-available 결정
- Mac App Store vs 직접 배포
- 자동 미팅 감지 시점 (v1 vs v1.5)
- 캐릭터 일러스트레이션·아이콘

---

## 참고할 외부 reference

- **Anarlog** (구 Hyprnote/Char) — `fastrepl/anarlog` GitHub
  - Tauri 기반 미팅 노트, MIT 라이선스
  - 오디오 캡처 (ScreenCaptureKit) Rust 패턴 차용
  - Provider adapter 패턴 정독
  - 1주일 dogfood 권장

- **Soniox docs** — streaming STT websocket 통합
- **OpenRouter docs** — Solar Pro 3 API 형식
- **Tauri 2.0 docs** — 특히 macOS-specific 권한·메뉴바·단축키

---

## Risk Watch

| Risk | Mitigation |
|---|---|
| ScreenCaptureKit Rust binding 어려움 | Anarlog 코드 차용, Phase 1 spike 미리 |
| Soniox 한국어 정확도 부족 | Phase 2 에서 Naver Clova / Whisper 비교 |
| Solar Pro 3 요약 품질 부족 | OpenRouter 라 Claude/Gemini 즉시 swap |
| Apple Developer 승인 지연 | Day 1 에 미리 신청 |
| 디자인 시스템 over-engineering | Phase 0 1주일 deadline 엄수, Phase 1 진입 |

---

## 명령어 cheat sheet (다음 세션용)

```bash
# 프로젝트 진입
cd ~/Dev/side/bartleby

# Tauri 부트스트랩 (한 번만)
pnpm create tauri-app .

# 개발
pnpm tauri dev

# 빌드 (나중에 Phase 6)
pnpm tauri build
```

---

## 마지막 한 줄

> "Bartleby has prepared the plan. Bartleby would prefer to start scaffolding next."
