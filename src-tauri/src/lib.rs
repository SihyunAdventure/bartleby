pub mod capture;

use capture::CaptureStats;

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

        capture::system_audio::capture_dual_to_opus(seconds, &system_base, &mic_base)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, capture_system_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
