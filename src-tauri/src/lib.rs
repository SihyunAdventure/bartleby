pub mod capture;
pub mod secrets;
pub mod stt;
pub mod summary;
pub mod translate;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use capture::CaptureStats;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, State, WindowEvent,
};
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, PanelLevel, StyleMask, WebviewWindowExt,
};
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
};

tauri_panel! {
    panel!(OverlayPanel {
        config: {
            can_become_key_window: true,
            is_floating_panel: true
        }
    })
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// In-progress capture session — stop flag drives the capture thread out of
/// its polling loop, the join handle returns final stats once it's done.
/// `stt` is `Some` iff `SONIOX_API_KEY` was set when the session started.
/// `translator` is `Some` iff *both* keys (SONIOX + OPENROUTER) are set —
/// translation can't operate without an STT source. Both are joined on
/// stop_capture in dependency order: capture → STT → translator.
struct CaptureSession {
    stop: Arc<AtomicBool>,
    handle: std::thread::JoinHandle<Result<CaptureStats, String>>,
    stt: Option<stt::SttSession>,
    translator: Option<translate::TranslatorSession>,
    summary: Option<summary::SummarySession>,
}

#[derive(Default)]
struct AppState {
    capture: Mutex<Option<CaptureSession>>,
}

/// Resolve a BYOK key by name. Tries macOS Keychain first (Settings UI
/// surface, §16), then ENV (dev convenience). Returns `None` if neither
/// source has a non-empty value. Logs which source resolved so a curious
/// developer can see precedence at a glance.
fn resolve_key(name: &str) -> Option<String> {
    if let Ok(Some(v)) = secrets::load(name) {
        if !v.is_empty() {
            println!("[secrets] {name} resolved from Keychain");
            return Some(v);
        }
    }
    if let Ok(v) = std::env::var(name) {
        if !v.is_empty() {
            println!("[secrets] {name} resolved from ENV");
            return Some(v);
        }
    }
    None
}

fn spawn_capture(
    app: tauri::AppHandle,
    max_seconds: Option<u64>,
) -> CaptureSession {
    let stop = Arc::new(AtomicBool::new(false));
    let stop_for_thread = Arc::clone(&stop);

    // BYOK key resolution — Keychain first (Settings UI from Day 18a), ENV
    // fallback (dev convenience: `source ~/.config/secrets/{soniox,upstage}.env`).
    // Both keys log their resolved source so the dev console makes the
    // precedence visible.
    //
    // Upstage direct (not OpenRouter) — OpenRouter's pooled Upstage account
    // ran out of credit 2026-05-08, indefinite outage. Direct API has same
    // pricing and avoids the routing dependency.
    let stt_key = resolve_key("SONIOX_API_KEY");
    let upstage_key = resolve_key("UPSTAGE_API_KEY");

    // Translator is the upstream consumer of STT finals — start it first so
    // STT can hand it the final-text sender at construction.
    let (final_tx, translator_session) = match (&stt_key, &upstage_key) {
        (Some(_), Some(up_key)) => {
            let (tx, sess) = translate::start(up_key.clone(), app.clone());
            (Some(tx), Some(sess))
        }
        (Some(_), None) => {
            println!("[translate] UPSTAGE_API_KEY not set — Korean translation disabled (English-only captions)");
            (None, None)
        }
        _ => (None, None),
    };

    // Summary subscribes to stt_final events directly via the event bus
    // (independent of the translator channel), so it gets its own session
    // gated on the same key pair. The Meeting SummaryPanel listens to its
    // emitted `summary_update` events.
    let summary_session = match (&stt_key, &upstage_key) {
        (Some(_), Some(up_key)) => Some(summary::start(up_key.clone(), app.clone())),
        _ => None,
    };

    let (stt_sender, stt_session) = match stt_key {
        Some(key) => {
            let (tx, sess) = stt::start(key, app.clone(), final_tx);
            (Some(tx), Some(sess))
        }
        None => {
            println!("[capture] SONIOX_API_KEY not set — STT disabled (overlay caption unavailable)");
            (None, None)
        }
    };

    let handle = std::thread::spawn(move || {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();

        let system_base = std::env::temp_dir()
            .join(format!("bartleby-system-{}", timestamp));
        let mic_base = std::env::temp_dir()
            .join(format!("bartleby-mic-{}", timestamp));
        let rss_log = std::env::temp_dir()
            .join(format!("bartleby-rss-{}.log", timestamp));

        capture::system_audio::capture_dual_to_opus(
            stop_for_thread,
            max_seconds,
            &system_base,
            &mic_base,
            &rss_log,
            stt_sender,
            &app,
        )
        .map_err(|e| e.to_string())
    });
    CaptureSession {
        stop,
        handle,
        stt: stt_session,
        translator: translator_session,
        summary: summary_session,
    }
}

/// Wait for a summary session to wind down. Cancel flag exits the 500ms
/// tick loop within ≤500ms.
fn join_summary(summary: summary::SummarySession) {
    summary::join(summary);
}

/// Wait for an STT session to wind down. Capture-thread teardown drops the
/// only fan-out `Sender`, which closes the bridge thread; this just joins
/// the runtime thread.
fn join_stt(stt: stt::SttSession) {
    stt.stop.store(true, Ordering::SeqCst);
    if let Err(e) = stt.join.join() {
        eprintln!("[stt] thread panicked: {e:?}");
    }
}

/// Wait for a translator session to wind down. STT teardown drops the
/// final-text sender, which closes the translator's recv loop; this joins
/// the runtime thread.
fn join_translator(translator: translate::TranslatorSession) {
    if let Err(e) = translator.join.join() {
        eprintln!("[translate] thread panicked: {e:?}");
    }
}

/// Fixed-duration capture (legacy command kept for the Day 4-9 button flow).
/// Spawns the same signal-driven capture and waits for `seconds` to elapse.
#[tauri::command]
async fn capture_system_audio(
    app: tauri::AppHandle,
    seconds: u64,
) -> Result<CaptureStats, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let session = spawn_capture(app, Some(seconds));
        let stats = session
            .handle
            .join()
            .map_err(|_| "Capture thread panicked".to_string())?;
        if let Some(stt) = session.stt {
            join_stt(stt);
        }
        if let Some(translator) = session.translator {
            join_translator(translator);
        }
        if let Some(s) = session.summary {
            join_summary(s);
        }
        stats
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Start an indefinite capture. The session lives in app state until
/// `stop_capture` is called. Errors if a capture is already in progress.
#[tauri::command]
async fn start_capture(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut guard = state.capture.lock().unwrap();
    if guard.is_some() {
        return Err("Capture already in progress".into());
    }
    *guard = Some(spawn_capture(app, None));
    Ok(())
}

/// Signal the running capture to stop and join the thread, returning stats.
#[tauri::command]
async fn stop_capture(
    state: State<'_, AppState>,
) -> Result<CaptureStats, String> {
    let session = state
        .capture
        .lock()
        .unwrap()
        .take()
        .ok_or_else(|| "No capture in progress".to_string())?;
    session.stop.store(true, Ordering::Relaxed);
    tauri::async_runtime::spawn_blocking(move || {
        let stats = session
            .handle
            .join()
            .map_err(|_| "Capture thread panicked".to_string())?;
        if let Some(stt) = session.stt {
            join_stt(stt);
        }
        if let Some(translator) = session.translator {
            join_translator(translator);
        }
        if let Some(s) = session.summary {
            join_summary(s);
        }
        stats
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Status row for an API key surfaced to the Settings UI.
#[derive(serde::Serialize)]
struct KeyStatus {
    /// True when *some* source (Keychain or ENV) holds a non-empty value.
    present: bool,
    /// Which source resolved — `"keychain"` / `"env"` / `null`.
    source: Option<&'static str>,
}

#[tauri::command]
fn api_key_status(name: String) -> Result<KeyStatus, String> {
    if let Ok(Some(v)) = secrets::load(&name) {
        if !v.is_empty() {
            return Ok(KeyStatus { present: true, source: Some("keychain") });
        }
    }
    if let Ok(v) = std::env::var(&name) {
        if !v.is_empty() {
            return Ok(KeyStatus { present: true, source: Some("env") });
        }
    }
    Ok(KeyStatus { present: false, source: None })
}

#[tauri::command]
fn save_api_key(name: String, value: String) -> Result<(), String> {
    secrets::save(&name, &value).map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_api_key(name: String) -> Result<(), String> {
    secrets::clear(&name).map_err(|e| e.to_string())
}

/// Probe a candidate key against the matching upstream service so the user
/// gets a verified ✓ / invalid ✗ verdict before committing it to Keychain.
/// Soniox = WebSocket handshake (no audio). Upstage = `max_tokens: 1` ping.
#[tauri::command]
async fn verify_api_key(name: String, value: String) -> Result<(), String> {
    if value.is_empty() {
        return Err("Empty key".into());
    }
    match name.as_str() {
        "SONIOX_API_KEY" => stt::soniox::verify_key(&value).await,
        "UPSTAGE_API_KEY" => translate::upstage::verify_key(&value).await,
        other => Err(format!("Unknown key: {other}")),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_nspanel::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState::default())
        .setup(|app| {
            // Regular activation = dock-visible Finder-like app. Meeting
            // mode (note-taking surface) is a primary user-facing entry, so
            // a dock icon + ⌘Tab cycle is on-spec. Overlay's fullScreenAuxiliary
            // collection behavior is a *window-level* property (NSPanel + style
            // mask) and works regardless of the app's activation policy —
            // the earlier "requires Accessory" comment was a misread. Menu bar
            // tray + ⌘⇧B remain as alt re-summon paths.
            app.set_activation_policy(tauri::ActivationPolicy::Regular);

            let overlay = app.get_webview_window("overlay").expect("overlay window");
            let panel = overlay.to_panel::<OverlayPanel>().expect("to_panel failed");
            panel.set_level(PanelLevel::Floating.value());
            // nonactivating_panel: 비활성 상태에서 클릭해도 backing app
            // (Bartleby) 을 활성화하지 않음. 즉시 drag 가능 + YouTube 등 다른
            // app focus 를 빼앗지 않음 (overlay는 passive caption display).
            panel.set_style_mask(StyleMask::empty().nonactivating_panel().into());
            // becomesKeyOnlyIfNeeded: 비활성 panel 첫 클릭이 panel 을 key 로
            // 만들기만 하고 swallow 되는 문제 (click-then-drag) 회피. 클릭이
            // underlying view 로 그대로 전달돼서 첫 클릭부터 drag 처리됨.
            panel.set_becomes_key_only_if_needed(true);
            panel.set_collection_behavior(
                CollectionBehavior::new()
                    .full_screen_auxiliary()
                    .can_join_all_spaces()
                    .into(),
            );
            // Drag is wired via `data-tauri-drag-region` attribute on the
            // overlay div (App.tsx). Tauri 2 injects a native mousedown handler
            // that calls plugin:window|start_dragging — capability granted in
            // capabilities/default.json (core:window:allow-start-dragging).

            // Menu bar tray: Accessory policy hides dock icon, so this is the
            // only way to re-summon main window after it's closed.
            let show = MenuItem::with_id(app, "show", "Show Bartleby", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;
            let _tray = TrayIconBuilder::with_id("bartleby-tray")
                .icon(app.default_window_icon().expect("window icon").clone())
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            // ⌘⇧B toggles main window visibility — power-user complement
            // to the menu bar item. Discovery is poor, but the gesture is
            // muscle-memory cheap once learned.
            let cmd_shift_b = Shortcut::new(
                Some(Modifiers::SUPER | Modifiers::SHIFT),
                Code::KeyB,
            );
            app.global_shortcut().on_shortcut(cmd_shift_b, |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("main") {
                        // Toggle 의도: "Bartleby 가 활성화돼 있을 때만 hide".
                        // is_visible() 만으로는 background 의 visible-but-not-focused
                        // 케이스에서 hide 가 호출돼 사용자 입장에서 변화 없는 듯
                        // 보이는 문제 발생 (Regular activation 으로 바꾼 뒤 더 두드러짐).
                        // is_visible && is_focused 둘 다일 때만 hide.
                        let visible = window.is_visible().unwrap_or(false);
                        let focused = window.is_focused().unwrap_or(false);
                        if visible && focused {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            })?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Intercept main window close so the user can re-summon it from
            // the tray. Overlay is not affected — closing it is a real close.
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            capture_system_audio,
            start_capture,
            stop_capture,
            api_key_status,
            save_api_key,
            clear_api_key,
            verify_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
