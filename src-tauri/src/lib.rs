pub mod capture;

use capture::CaptureStats;
use tauri::Manager;
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
            panel.set_style_mask(StyleMask::empty().nonactivating_panel().into());
            panel.set_collection_behavior(
                CollectionBehavior::new()
                    .full_screen_auxiliary()
                    .can_join_all_spaces()
                    .into(),
            );
            // Drag handling is wired on the JS side via startDragging() because
            // it doubles as the chrome-button pattern (mousedown on draggable
            // surface, ignore on no-drag elements). See Overlay in App.tsx.
            // (Note: drag still not working as of this commit — see NEXT.md
            // for the next-session probe sequence.)
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, capture_system_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
