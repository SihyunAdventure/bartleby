pub mod capture;
pub mod stt;

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
/// `stt` is `Some` iff `SONIOX_API_KEY` was set when the session started; it
/// runs in parallel and is joined on stop_capture.
struct CaptureSession {
    stop: Arc<AtomicBool>,
    handle: std::thread::JoinHandle<Result<CaptureStats, String>>,
    stt: Option<stt::SttSession>,
}

#[derive(Default)]
struct AppState {
    capture: Mutex<Option<CaptureSession>>,
}

fn spawn_capture(
    app: tauri::AppHandle,
    max_seconds: Option<u64>,
) -> CaptureSession {
    let stop = Arc::new(AtomicBool::new(false));
    let stop_for_thread = Arc::clone(&stop);

    // BYOK: SONIOX_API_KEY env var (set via `source ~/.config/secrets/soniox.env`
    // before launching `pnpm tauri dev`). Settings UI surface comes in §16.
    let (stt_sender, stt_session) = match std::env::var("SONIOX_API_KEY") {
        Ok(key) if !key.is_empty() => {
            let (tx, sess) = stt::start(key, app.clone());
            (Some(tx), Some(sess))
        }
        _ => {
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
    }
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
        stats
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_nspanel::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState::default())
        .setup(|app| {
            // fullScreenAuxiliary collection behavior requires Accessory or
            // Prohibited activation policy. Bartleby is overlay-first (watch
            // mode = primary surface), so dropping the dock icon is on-spec.
            // Main window is reachable via menu bar item (Phase 0+).
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

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
                        if window.is_visible().unwrap_or(false) {
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
            stop_capture
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
