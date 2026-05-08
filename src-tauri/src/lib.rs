pub mod capture;

use capture::CaptureStats;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WindowEvent,
};
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, PanelLevel, StyleMask, WebviewWindowExt,
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

/// Capture system audio and microphone for `seconds` seconds and return statistics.
///
/// Encodes each source to rolling 5-second Ogg Opus segment files at 32 kbps
/// and returns combined stats including drift analysis. Runs blocking SCStream
/// capture on a dedicated thread so the Tauri async runtime stays responsive.
#[tauri::command]
async fn capture_system_audio(seconds: u64) -> Result<CaptureStats, String> {
    tauri::async_runtime::spawn_blocking(move || {
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

        capture::system_audio::capture_dual_to_opus(seconds, &system_base, &mic_base, &rss_log)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_nspanel::init())
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
        .invoke_handler(tauri::generate_handler![greet, capture_system_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
