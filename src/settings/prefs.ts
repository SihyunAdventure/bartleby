// User preferences — persisted in localStorage, broadcast across Tauri
// windows via the event bus so Settings 변경이 즉시 반영된다.
// Keys are organized as a single namespaced object so a future migration
// to tauri-plugin-store is one read/write.

import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";

const STORAGE_KEY = "bartleby.prefs.v1";
const EVENT_NAME = "prefs_changed";

export type ProviderMode = "hosted" | "byok";
export type AppLanguage = "ko" | "en";

export interface Prefs {
  // Onboarding
  onboarding_completed: boolean;
  onboarding_language: AppLanguage;

  // Provider access
  // hosted = Notique/Bartleby relay token (friends beta), byok = user's own Soniox/Upstage keys.
  provider_mode: ProviderMode;

  // Meeting mode
  auto_summarize: boolean;
  // 영어 → 한국어 번역 가동 여부. false 면 translator session 안 띄움 (네트워크/비용 절약).
  // 한국어 미팅 (모두 한국어 발화) 에서 KO line 이 EN 의 자가 번역 같아 어색할 때 끄기.
  translate_enabled: boolean;

  // Storage
  audio_retention_days: number;     // 1-90

  // Privacy
  // 익명 사용 통계(PostHog) 전송 여부. 회의 내용·transcript·제목·키는
  // 절대 전송하지 않고 이벤트 메타데이터만 보낸다. Settings 에서 끌 수 있음.
  analytics_enabled: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  onboarding_completed: false,
  onboarding_language: "ko",

  provider_mode: "hosted",

  auto_summarize: true,
  // 한국어 미팅 위주 user 가 default. 영어 시청 / 영어 client call 시
  // Settings 에서 켜는 형태. STT 가 audio 언어 자동 인식하므로 한국어
  // 미팅엔 toggle 무관하게 KO 발화는 자체 transcribe.
  translate_enabled: false,

  audio_retention_days: 30,

  analytics_enabled: true,
};

export function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    const merged = { ...DEFAULT_PREFS, ...parsed };
    if (merged.provider_mode !== "hosted" && merged.provider_mode !== "byok") {
      merged.provider_mode = DEFAULT_PREFS.provider_mode;
    }
    if (merged.onboarding_language !== "ko" && merged.onboarding_language !== "en") {
      merged.onboarding_language = DEFAULT_PREFS.onboarding_language;
    }
    return merged;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Broadcast — Overlay window listens and re-renders. Errors swallowed
  // because Settings is the source of truth; the listener can recover
  // by polling localStorage on next mount if an emit ever drops.
  void emit(EVENT_NAME, prefs);
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): Prefs {
  const next = { ...loadPrefs(), [key]: value };
  savePrefs(next);
  return next;
}

export async function listenToPrefs(
  onChange: (prefs: Prefs) => void,
): Promise<UnlistenFn> {
  return listen<Prefs>(EVENT_NAME, (event) => onChange(event.payload));
}
