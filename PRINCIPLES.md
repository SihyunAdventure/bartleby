# Bartleby — Design Implementation Principles

> 디자인 시스템을 코드로 옮기거나 확장할 때 *반드시* 따라야 할 원칙.
> agent / 사람 모두 이 문서를 작업 시작 전 읽고, 작업 완료 시 체크.
> 잊어버려도 이 파일이 기억함.

---

## 0. 최상위 법칙 (Sacred Law)

> **`design-system/` 폴더는 영구 read-only. 절대 삭제·수정·이동 X.**
>
> 이 폴더는 디자인 의도의 *유일한 진실의 원본*이다.
> production 코드 (`src/`) 가 디자인에서 벗어났는지 검증할 *유일한 기준*이다.
> 새 컴포넌트 추가 시 패턴을 차용할 *유일한 reference* 이다.
> 새 팀원·새 agent 가 디자인 의도를 이해할 *유일한 spec* 이다.

이 법칙을 어기는 commit 은 reject. 의문 시 *항상 보존 쪽으로* 결정.

---

## 1. agent 의 누락은 *기본값* 이다

agent 가 코드 → 코드 변환할 때 누락은 *예외* 가 아니라 *기본값*이다.
잘 만든 agent 도 첫 패스에서 30-40% 의 디테일을 놓친다.

**그래서 우리는 검증 없이 작업을 완료로 간주하지 않는다.**

검증 없는 "다 만들었어요" = 미완료.
체크리스트 없는 "다 만들었어요" = 미완료.
시각 비교 없는 "다 만들었어요" = 미완료.

---

## 2. 누락 방어 3중 체계

### 2.1 [1차] 원본 영구 보존
- `design-system/` 폴더는 *commit 으로 박아두고 절대 건드리지 않음*
- agent 가 작업할 때마다 다시 reference 가능
- 시간이 흘러도 "원래 의도가 뭐였지?" 답을 찾을 수 있음

### 2.2 [2차] 19 섹션 매핑 표 (autoplan 2026-05-07 — 14→19 확장)
- 모든 디자인 작업 직후 `NEXT.md` Step 5b 의 매핑 표를 채운다
- 19 row 가 *전부 ✅* 일 때만 작업 완료
- 한 row 라도 ☐ 이면 미완료. 보고하고 추가 작업.
- **추가 acceptance per row** (특히 dual-mode):
  - row 5/6/7 (Buttons/Forms/Recording state) — *시청 모드 + 미팅 모드 양쪽 state* 검증
  - row 11 (Voice library) — *Watch mode 전용 voice copy matrix* (idle/listening/captioning/translating/reconnecting/drm-blocked/permission-denied/complete) 도 ✅
  - row 14 (Marketing) — *Watch hero* 가 primary, meeting hero 가 secondary
  - row 15 (WatchOverlay) — `design-system-extensions/overlay.md` spec 의 모든 state ·token · voice 일치
  - row 17 (Settings) — `design-system-extensions/settings.md` spec 의 5 탭 모두 구현

### 2.3 [3차] 시각 비교 (visual diff)
- 사용자가 직접 *원본 HTML + 우리 gallery* 좌우 띄우고 비교
- section by section 으로 본다 — *전체 인상* 으로 판단 X
- 명령어:
  ```bash
  # 원본
  cd ~/Dev/side/bartleby/design-system/bartleby/project
  python3 -m http.server 8081
  # http://localhost:8081/Bartleby%20Design%20System.html

  # 우리 앱
  cd ~/Dev/side/bartleby && pnpm tauri dev
  # /__gallery
  ```

**3중 통과 안 한 작업 = 미완료.**

---

## 3. agent 가 자주 누락하는 5가지 (우선 점검)

### 3.1 Voice copy (시스템 메시지·에러)
- 가장 자주 빠짐. agent 가 본인 표현으로 paraphrase 하는 본능이 강함.
- 원본 문구 *글자 그대로* 유지. "Bartleby would prefer not to." 등.
- design-system 의 `#voice` 섹션 → 우리 앱의 모든 toast / error / empty state 와 1:1 매핑되는지 점검.

### 3.2 Form 의 *조합 상태* (variant × state)
- 예: BYOK key field 의 `verified` (체크 + ok 색) / `invalid` (X + 에러 색) / `loading` (스피너) 상태
- agent 가 기본 input 만 만들고 *조합 variant* 를 빠뜨리기 쉬움
- 모든 form 컴포넌트 → *상태 매트릭스* 로 점검

### 3.3 Recording state 전환 인터랙션
- 정적 컴포넌트 4개만 만들고 *전환 timing·애니메이션* 빠뜨리기 쉬움
- idle → listening → processing → complete 순서·전환 효과·audio meter 동작
- *움직이는* 부분이라 정적 비교만으론 못 잡음. 실제 동작 확인 필수.

### 3.4 Applied screens (Library, Recording session)
- 단순 컴포넌트 갤러리만 만들고 *실제 layout 통합* 누락 가능
- design-system 의 `screens.jsx` 가 우리 앱 *실제 라우트* 로도 사용됨
- gallery 의 #screens 섹션 = `/library` + `/live` 라우트 = 같은 컴포넌트 재사용

### 3.5 Marketing 컴포넌트
- "앱 외부니까 나중에" 로 미루기 쉬운 함정
- 디자인 시스템의 일부. Phase 5 (랜딩 페이지) 에서 그대로 재사용.
- *Phase 0 에서 함께 빌드* 가 효율적. 미루지 말 것.

---

## 4. 변환 규칙 (어떻게 옮기나)

### 4.1 파일별 처리 (NEXT.md Step 5 와 일치)

| 파일 | 처리 |
|---|---|
| `tokens.css` | 🟢 **그대로 복사** — OKLCH 한 글자도 안 바뀜 |
| `components.css` | 🟡 **부분 차용** — 스타일 값 유지, 컴포넌트별 분해 |
| `components.jsx` | 🔴 **읽고 React+TS 로 재작성** — 비주얼 매칭, 내부는 우리 패턴 |
| `screens.jsx` | 🔴 **재작성** + 실제 라우트로도 사용 |
| `macos-window.jsx` | 🔴 **재작성** — Tauri 의 native chrome 통합 |
| `app.jsx`, `page.css` | ⚫ **무시** — 디자인 시스템 페이지 entry 전용 |
| `tweaks-panel.jsx` | ⚫ **무시** — 디자이너용 tweaks, 앱 X |
| `Bartleby Design System.html` | ⚫ **무시** — handoff 메인 페이지 |

### 4.2 절대 바꾸지 말 것 (Sacred Values)

- **OKLCH 컬러 값** — hex 변환 금지. 디자인 의도 깨짐.
- **Accent = ink 자체** — 별도 accent 컬러 추가 금지. design intent.
- **폰트 5종 stack** — JetBrains Mono · Inter · Pretendard · Cormorant · Gowun Batang · D2Coding. 다른 폰트로 substitute 금지.
- **Voice copy** — 문구 그대로. paraphrase 금지.
- **Korean fallback** — `:lang(ko)`, `.ko-*` 유틸리티 시스템 그대로.
- **Personality 75%** — literary 캐릭터 강도. 시스템 메시지·에러에 italic serif 보존.

#### 4.2.1 Korean typography exception (autoplan 2026-05-07 추가)

design-system 의 *static* 표면 (notes, summaries, voice cards, marketing) 은 **Gowun Batang serif** 그대로.
하지만 *live* 표면 (시청 모드 overlay 의 라이브 자막) 은 **Pretendard sans (`--font-body-kr`) 사용**.

이유: Gowun Batang 14-16px live caption rate 에서 stroke contrast 가 dynamic video 배경에서 사라짐.
codex + designer agent 둘 다 critical 신호.

규칙:
- 시청 모드 overlay caption (final + partial) → Pretendard
- 시청 모드 노트 (사용자가 저장한 후처리 markdown) → Gowun Batang (static)
- 미팅 모드 transcript live → Pretendard
- 미팅 모드 summary/decisions/quotes → Gowun Batang (static)
- 모든 italic serif voice copy ("prefer not to" 류) → Cormorant (그대로 유지)
- 모든 marketing surface → Gowun Batang (그대로 유지)

→ 한 줄 정리: **live = Pretendard, static = Gowun Batang.**

### 4.3 변경 가능한 것 (Implementation Freedom)

- 컴포넌트 internal 구조 (props, state 관리, hooks)
- 폴더 구조, 파일 분리, 명명 규칙
- TypeScript 타입 추가, 접근성 보강
- React 패턴 (memo, useCallback 등)
- 테스트 코드 추가
- *비주얼 결과물이 동일한 한* 자유

---

## 5. 검증 의식 (Verification Rituals)

### 5.1 작업 시작 전
- [ ] `design-system/bartleby/README.md` 읽기
- [ ] `design-system/bartleby/chats/chat1.md` 읽기 (디자인 의사결정 맥락)
- [ ] `tokens.css` 통독 (변경 금지 대상 인지)
- [ ] 본 PRINCIPLES.md 읽기

### 5.2 작업 중
- [ ] 새 컴포넌트 만들 때마다 design-system 의 해당 섹션 다시 열어보기
- [ ] OKLCH 값·voice copy 는 *복붙*. 손으로 다시 쓰지 말 것.
- [ ] 의문 시 → DESIGN.md 가 아니라 *원본 source 파일* 을 봄

### 5.3 작업 완료 보고 시
- [ ] 14 섹션 매핑 표 (NEXT.md Step 5b) 채워서 보고
- [ ] 모든 row ✅ 인지 명시
- [ ] 빠진 row 있으면 *완료* 라 말하지 말 것

### 5.4 사용자 검증
- [ ] HTTP 서버로 원본 페이지 띄우기
- [ ] `pnpm tauri dev` 로 우리 gallery 띄우기
- [ ] 좌우 모니터에 나란히
- [ ] 14 섹션 모두 시각 비교
- [ ] 불일치 발견 → 다음 spot fix 사이클로

### 5.5 spot fix 사이클 (정상 흐름)
첫 패스에서 누락 있는 게 *정상*이다. 패닉 X.

```
1. 시각 비교에서 불일치 N개 발견
2. 각 불일치를 *구체적인 prompt* 로 정리
   ❌ "디자인이 좀 달라 보임"
   ✅ "/__gallery#forms 의 BYOK key field 에 verified 상태가 누락.
       design-system/.../components.css 의 .input-key.verified 정의 따라 추가."
3. designer agent 에게 spot fix 위임
4. 다시 시각 비교
5. 모든 불일치 0 → 완료
```

2-3 사이클이 보통. 1번에 끝나면 운 좋음.

---

## 6. 변경 관리 (Change Management)

### 6.1 디자인 시스템 자체를 바꾸고 싶을 때
- `design-system/` 은 read-only 라 직접 수정 X
- 새 디자인 결정은 `design-system-extensions/` 또는 `DESIGN-NEW.md` 같은 *별도 위치*
- Claude Design 에서 새 핸드오프 받으면 `design-system-v2/` 형태로 추가
- 기존 `design-system/` 은 *historical record* 로 유지

### 6.2 production 컴포넌트가 디자인에서 벗어났을 때
- *production 코드를 고침*. 디자인 시스템을 따라가는 게 우선.
- 디자인 의도와 충돌 시 → 사용자 결정 (디자인 변경 vs 코드 fix)
- 디자인 의도를 *우회* 하지 말 것 (편의 위해 hex 컬러 사용 등)

### 6.3 새 컴포넌트가 필요한데 디자인 시스템에 없을 때
- 기본 원칙 (OKLCH, 폰트 stack, voice 등) 안에서 *기존 컴포넌트 패턴 차용*
- 정말 새 패턴이면 *Claude Design 으로 핸드오프* 받기 (또는 사용자 디자인 결정)
- production 코드에서 *즉흥 디자인* 추가 금지

---

## 7. 한 줄 강령

> **원본은 영구 보존. 작업 후 반드시 시각 비교. 14 섹션 매핑 표 ✅ 모두 차야 완료.**
> **누락은 기본값이다 — 검증 없는 완료는 미완료다.**

이 두 줄을 매 작업 전 다시 읽는다.

---

## 8. 참조 문서

- [README.md](./README.md) — 프로젝트 오리엔테이션
- [VISION.md](./VISION.md) — 제품 비전·포지셔닝
- [DESIGN.md](./DESIGN.md) — 디자인 시스템 high-level summary
- [PLAN.md](./PLAN.md) — 8주 실행 계획
- [NEXT.md](./NEXT.md) — 다음 세션 continuation + 14 섹션 매핑 표
- [design-system/](./design-system/) ⭐ — Source of truth (절대 read-only)
