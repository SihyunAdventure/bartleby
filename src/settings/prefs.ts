// User preferences — persisted in localStorage, broadcast across Tauri
// windows via the event bus so the Overlay can react to changes the
// moment Settings saves them. Keys are organized as a single namespaced
// object so a future migration to tauri-plugin-store is one read/write.
//
// Wired to overlay rendering this chunk: caption_mode, overlay_opacity,
// caption_font_size. Other fields are storage-only and surface in a
// later slice when the consumer infra exists (window positioning,
// click-through toggle, mic enumeration, etc).

import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";

const STORAGE_KEY = "bartleby.prefs.v1";
const EVENT_NAME = "prefs_changed";

export type AppMode = "watch" | "meeting";
export type CaptionMode = "ko" | "ko_en" | "en";
export type OverlayPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";
export type BilingualLayout = "side_by_side" | "ko_above_en" | "single_auto";
export type SummaryLanguage = "ko" | "en";
export type UpdateChannel = "stable" | "beta";

export interface Prefs {
  app_mode: AppMode;             // 'watch' | 'meeting' — top-level mode toggle

  // Watch mode
  caption_mode: CaptionMode;
  overlay_opacity: number;          // 60-100 (%)
  caption_font_size: number;        // 14-18 (px)
  overlay_position: OverlayPosition;
  caption_pause_threshold_s: number;
  click_through_default: boolean;

  // Meeting mode
  mic_source: string;               // "default" until enumeration ships
  bilingual_layout: BilingualLayout;
  auto_summarize: boolean;
  summary_language: SummaryLanguage;
  // 영어 → 한국어 번역 가동 여부. false 면 translator session 안 띄움 (네트워크/비용 절약).
  // 한국어 미팅 (모두 한국어 발화) 에서 KO line 이 EN 의 자가 번역 같아 어색할 때 끄기.
  translate_enabled: boolean;

  // Storage
  save_path: string;                // ~/Documents/Bartleby/ display only
  audio_retention_days: number;     // 1-90

  // Updates
  update_channel: UpdateChannel;
}

export const DEFAULT_PREFS: Prefs = {
  app_mode: "watch",
  caption_mode: "ko",
  overlay_opacity: 85,
  caption_font_size: 16,
  overlay_position: "bottom-left",
  caption_pause_threshold_s: 3,
  click_through_default: false,

  mic_source: "default",
  bilingual_layout: "side_by_side",
  auto_summarize: true,
  summary_language: "ko",
  // 한국어 미팅 위주 user 가 default. 영어 시청 / 영어 client call 시
  // Settings 에서 켜는 형태. STT 가 audio 언어 자동 인식하므로 한국어
  // 미팅엔 toggle 무관하게 KO 발화는 자체 transcribe.
  translate_enabled: false,

  save_path: "~/Documents/Bartleby/",
  audio_retention_days: 30,

  update_channel: "stable",
};

export function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { ...DEFAULT_PREFS, ...parsed };
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
