# Bartleby Gallery — Section Map

`design-system/` 원본 → `src/gallery/` React+TS 재현 진행 상황 추적표.
PRINCIPLES.md §2.2 가 가리키는 19 섹션 전체 매핑.

**ritual**: 어떤 섹션 추가·변경 직후에도 이 표를 즉시 업데이트할 것.
담당 agent 는 작업 완료 보고 시 이 표의 Status · Day · Gate 컬럼 업데이트 포함.

**Gate 의미** (PRINCIPLES.md §2.2 참조):
- **ship** = production rendering path 에 직접 사용. Phase 0 acceptance + v1 launch prerequisite. **12 sections.**
- **polish** = Phase 6 marketing prep / 후속 polish. **7 sections.** Sacred Values (§4.2) 는 모든 row 에서 enforce — gate split 은 *완료 acceptance 범위* 만 좁힘.

---

| § | Title | Gate | Source | Status | Day | Notes |
|---|-------|------|--------|--------|-----|-------|
| 00 | Manifesto | polish | app.jsx L134-170 | ✅ | 13 | DSSection + rule-item 4개. Voice carrier 지만 production rendering 직접 X. |
| 01 | Color | **ship** | app.jsx L172-225 | ✅ | 13 | Swatch + theme-pair (light/dark) |
| 02 | Typography | **ship** | app.jsx L227-345 + page.css L118-189 | ⏳ | — | TypeScale (10 ladder rows × EN/KR) + bilingual pair-table (4 rows). **Risks**: kr-leading-bump CSS calc, Gowun Batang 로드 검증, pair-table border-radius+overflow:hidden Tauri WebView 호환, type-spec :lang(ko) role italic. |
| 03 | Spacing · Radius · Elevation | **ship** | app.jsx | ⏳ | — | SpacingShadow |
| 04 | Buttons | **ship** | app.jsx | ⏳ | — | ButtonGallery — dual-mode (시청/미팅) 검증 |
| 05 | Form controls | **ship** | app.jsx | ⏳ | — | FormGallery — BYOK key field 의 verified/invalid/loading variant 매트릭스 |
| 06 | Recording state | **ship** | app.jsx | ⏳ | — | RecordingStates — idle/listening/processing/complete + dual-mode |
| 07 | Badges & dots | polish | app.jsx | ⏳ | — | BadgeGallery |
| 08 | Domain blocks | polish | app.jsx | ⏳ | — | DomainBlocks |
| 09 | Sidebar + titlebar | **ship** | app.jsx | ⏳ | — | SidebarPattern — Library + Live mode 의 chrome |
| 10 | Voice library | polish | app.jsx | ⏳ | — | VoiceLibrary 컴포넌트는 polish, **voice strings 자체는 ship 전 inline 정확** (모든 toast/error/empty state) |
| 11 | Applied screens | **ship** | app.jsx | ⏳ | — | AppliedScreens — `/library` + `/live` 라우트 = 같은 컴포넌트 재사용 |
| 12 | App icon | polish | app.jsx | ⏳ | — | AppIcon — Phase 6 |
| 13 | Marketing | polish | app.jsx | ⏳ | — | Marketing — §18 reframe 시점에 통합 결정 |
| 16 | Settings UI | **ship** | design-system-extensions/settings.md | ⏳ | — | BYOK key 입력해야 v1 작동 — ship 필수. 5 탭 (Keys/Modes/Storage/Shortcuts/About) |
| 17 | Permission Lifecycle | **ship** | design-system-extensions/permission.md | ⏳ | — | Mic/Screen Recording 권한 요청·거부·복구 flow |
| 18 | Marketing Hero — Watch reframe | polish | design-system-extensions/marketing-hero.md | ⏳ | — | §13 Marketing 의 reframe — Phase 6 시점 결정 |

**Gate 합계**: ship **10** + polish **7** = 17 ✅ (§14 WatchOverlay · §15 ModeSwitch 제거 — Watch 모드 삭제로 dead reference)

---

## 검증 워크플로우

섹션 추가 후 매번 수행:

1. **개발 서버 실행**: `pnpm tauri dev` (백그라운드)
2. **Gallery 확인**: 브라우저에서 `http://localhost:1420/?gallery` 열기

   **중요**: 외부 브라우저(Chrome/Safari)에서 1280px 이상 width 로 열 것. Tauri main window 는 800x600 default 라 항상 mobile layout (1100px 이하 collapse) 으로 보임. 시각 비교는 외부 브라우저에서.

3. **원본 비교**: `design-system/bartleby/project/bartleby/` 의 HTML을 브라우저에서 열어 좌우 비교
4. **타입 검사**: `npx tsc --noEmit` 통과 확인
5. **Rust 회귀 없음**: `cargo test --manifest-path src-tauri/Cargo.toml --lib` 23 tests pass

참고: DESIGN.md L207-219 에 비교 절차 상세 기술.
