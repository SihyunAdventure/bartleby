pub mod capture;

use capture::CaptureStats;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Capture system audio for `seconds` seconds and return statistics.
///
/// Runs the blocking SCStream capture on a dedicated thread so the Tauri
/// async runtime stays responsive during the capture window.
#[tauri::command]
async fn capture_system_audio(seconds: u64) -> Result<CaptureStats, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();

        let filename = format!("bartleby-capture-{}.wav", timestamp);
        let output_path = std::env::temp_dir().join(filename);

        capture::system_audio::capture_to_wav(seconds, &output_path)
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
