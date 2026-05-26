pub mod capture;
pub mod secrets;
pub mod stt;
pub mod summary;
pub mod translate;

use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use capture::CaptureStats;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, State, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// In-progress capture session — stop flag drives the capture thread out of
/// its polling loop, the join handle returns final stats once it's done.
/// `stt` is `Some` iff `SONIOX_API_KEY` was set when the session started.
/// `translator` is `Some` iff *both* keys (SONIOX + OPENROUTER) are set —
/// translation can't operate without an STT source. Both are joined on
/// stop_capture in dependency order: capture → STT → translator.
struct CaptureSession {
    stop: Arc<AtomicBool>,
    handle: std::thread::JoinHandle<Result<CaptureStats, String>>,
    /// Two STT sessions — sys is the canonical wedge ("Korean ears for English
    /// audio"), feeds the translator. mic is the user's own voice, surfaced
    /// directly without translation (Phase 6 S3 wire). Both join on stop.
    stt_sys: Option<stt::SttSession>,
    stt_mic: Option<stt::SttSession>,
    translator: Option<translate::TranslatorSession>,
    summary: Option<summary::SummarySession>,
}

#[derive(Default)]
struct AppState {
    capture: Mutex<Option<CaptureSession>>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum ProviderMode {
    Hosted,
    Byok,
}

impl ProviderMode {
    fn from_option(value: Option<String>) -> Self {
        match value.as_deref().map(|v| v.trim().to_ascii_lowercase()) {
            Some(v) if v == "byok" => Self::Byok,
            _ => Self::Hosted,
        }
    }
}

const DEFAULT_RELAY_BASE_URL: &str = "https://api.heybartleby.com";

fn relay_base_url() -> String {
    std::env::var("BARTLEBY_RELAY_URL")
        .ok()
        .map(|v| v.trim().trim_end_matches('/').to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| DEFAULT_RELAY_BASE_URL.to_string())
}

fn relay_ws_url() -> String {
    let base = relay_base_url();
    let ws_base = if let Some(rest) = base.strip_prefix("https://") {
        format!("wss://{rest}")
    } else if let Some(rest) = base.strip_prefix("http://") {
        format!("ws://{rest}")
    } else {
        base
    };
    format!("{ws_base}/v1/stt/realtime")
}

fn secret_file_for(name: &str) -> Option<&'static str> {
    match name {
        "SONIOX_API_KEY" => Some("soniox.env"),
        "UPSTAGE_API_KEY" => Some("upstage.env"),
        "BARTLEBY_RELAY_TOKEN" => Some("bartleby-relay.env"),
        _ => None,
    }
}

fn load_secret_file(name: &str) -> Option<String> {
    let file = secret_file_for(name)?;
    let Some(home) = std::env::var_os("HOME") else {
        return None;
    };
    let path = std::path::PathBuf::from(home)
        .join(".config/secrets")
        .join(file);
    let Ok(content) = std::fs::read_to_string(&path) else {
        return None;
    };
    for line in content.lines() {
        let line = line.trim().trim_start_matches("export ");
        if let Some((key, value)) = line.split_once('=') {
            if key.trim() == name {
                let v = value.trim().trim_matches(|c| c == '"' || c == '\'');
                if !v.is_empty() {
                    println!(
                        "[secrets] {name} resolved from file fallback ({})",
                        path.display()
                    );
                    return Some(v.to_string());
                }
            }
        }
    }
    None
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
    // Dev fallback — read $HOME/.config/secrets/<service>.env directly.
    // dev-run.sh sources these into the shell, but if the user launches
    // Bartleby via Spotlight/Finder/menu-bar instead of the script the
    // ENV isn't there. Reading the file directly closes that gap so the
    // user doesn't lose Keys verified every time they re-launch.
    load_secret_file(name)
}

/// Phase 6 S5 debug — surface frontend console messages into the Rust
/// debug.log file so we can diagnose handleStop / persistSessions flow
/// without keeping the webview inspector open. Temporary instrumentation;
/// remove once the session-save path is stable.
#[tauri::command]
fn log_frontend(msg: String) {
    println!("[frontend] {msg}");
}

#[derive(serde::Serialize)]
struct AudioSegments {
    sys: Vec<String>,
    mic: Vec<String>,
}

#[derive(serde::Serialize)]
struct StorageStatus {
    app_data_dir: String,
    audio_dir: String,
    audio_bytes: u64,
    database_bytes: u64,
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    tauri::Manager::path(app)
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))
}

fn dir_size(path: &Path) -> u64 {
    let Ok(meta) = std::fs::metadata(path) else {
        return 0;
    };
    if meta.is_file() {
        return meta.len();
    }
    let Ok(entries) = std::fs::read_dir(path) else {
        return 0;
    };
    entries
        .filter_map(Result::ok)
        .map(|entry| dir_size(&entry.path()))
        .sum()
}

fn storage_status_inner(app: &tauri::AppHandle) -> Result<StorageStatus, String> {
    let app_dir = app_data_dir(app)?;
    let audio_dir = app_dir.join("audio");
    let db_path = app_dir.join("bartleby.db");
    Ok(StorageStatus {
        app_data_dir: app_dir.display().to_string(),
        audio_dir: audio_dir.display().to_string(),
        audio_bytes: dir_size(&audio_dir),
        database_bytes: std::fs::metadata(db_path).map(|m| m.len()).unwrap_or(0),
    })
}

fn audio_dir_timestamp_ms(path: &Path) -> Option<u128> {
    if let Some(ts) = path
        .file_name()
        .and_then(|s| s.to_str())
        .and_then(|s| s.parse::<u128>().ok())
    {
        return Some(ts);
    }
    let modified = std::fs::metadata(path).ok()?.modified().ok()?;
    modified
        .duration_since(std::time::UNIX_EPOCH)
        .ok()
        .map(|d| d.as_millis())
}

#[tauri::command]
fn storage_status(app: tauri::AppHandle) -> Result<StorageStatus, String> {
    storage_status_inner(&app)
}

#[tauri::command]
fn open_storage_folder(app: tauri::AppHandle) -> Result<(), String> {
    let app_dir = app_data_dir(&app)?;
    std::fs::create_dir_all(&app_dir).map_err(|e| format!("create app data dir: {e}"))?;
    std::process::Command::new("open")
        .arg(&app_dir)
        .spawn()
        .map_err(|e| format!("open Finder: {e}"))?;
    Ok(())
}

#[tauri::command]
fn cleanup_old_audio(app: tauri::AppHandle, retention_days: u64) -> Result<StorageStatus, String> {
    let retention_days = retention_days.clamp(1, 3650);
    let app_dir = app_data_dir(&app)?;
    let audio_root = app_dir.join("audio");
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("system clock: {e}"))?
        .as_millis();
    let retention_ms = retention_days as u128 * 24 * 60 * 60 * 1000;
    let cutoff_ms = now_ms.saturating_sub(retention_ms);

    if let Ok(entries) = std::fs::read_dir(&audio_root) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let Some(ts_ms) = audio_dir_timestamp_ms(&path) else {
                continue;
            };
            if ts_ms < cutoff_ms {
                std::fs::remove_dir_all(&path)
                    .map_err(|e| format!("remove {}: {e}", path.display()))?;
            }
        }
    }

    storage_status_inner(&app)
}

#[tauri::command]
fn recording_permission_status() -> capture::permission::RecordingPermissionStatus {
    capture::permission::recording_status()
}

#[tauri::command]
fn request_microphone_permission() -> capture::permission::RecordingPermissionStatus {
    capture::permission::request_microphone_access();
    capture::permission::recording_status()
}

#[tauri::command]
fn request_screen_recording_permission() -> capture::permission::RecordingPermissionStatus {
    capture::permission::request_screen_recording_access();
    capture::permission::recording_status()
}

fn open_privacy_settings(anchor: &str) -> Result<(), String> {
    std::process::Command::new("open")
        .arg(format!(
            "x-apple.systempreferences:com.apple.preference.security?{anchor}"
        ))
        .spawn()
        .map_err(|e| format!("open System Settings: {e}"))?;
    Ok(())
}

#[tauri::command]
fn open_microphone_settings() -> Result<(), String> {
    open_privacy_settings("Privacy_Microphone")
}

#[tauri::command]
fn open_screen_recording_settings() -> Result<(), String> {
    open_privacy_settings("Privacy_ScreenCapture")
}

/// List playable Opus files under a session's audio_dir. Prefers the
/// finalized sys.opus / mic.opus single-file concat (continuous timeline);
/// falls back to the rolling sys-NNN.opus / mic-NNN.opus segments when
/// the concat hasn't run yet. Frontend converts paths to webview-safe
/// URLs via convertFileSrc.
#[tauri::command]
fn list_audio_segments(dir: String) -> Result<AudioSegments, String> {
    let path = std::path::Path::new(&dir);
    if !path.is_dir() {
        return Ok(AudioSegments {
            sys: vec![],
            mic: vec![],
        });
    }

    let sys_concat = path.join("sys.opus");
    let mic_concat = path.join("mic.opus");
    let mut sys = if sys_concat.is_file() {
        vec![sys_concat.display().to_string()]
    } else {
        Vec::new()
    };
    let mut mic = if mic_concat.is_file() {
        vec![mic_concat.display().to_string()]
    } else {
        Vec::new()
    };

    if !sys.is_empty() && !mic.is_empty() {
        return Ok(AudioSegments { sys, mic });
    }

    for entry in std::fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        let p = entry.path().display().to_string();
        if sys.is_empty() && name.starts_with("sys-") && name.ends_with(".opus") {
            sys.push(p);
        } else if mic.is_empty() && name.starts_with("mic-") && name.ends_with(".opus") {
            mic.push(p);
        }
    }
    if sys.len() > 1 {
        sys.sort();
    }
    if mic.len() > 1 {
        mic.sort();
    }
    Ok(AudioSegments { sys, mic })
}

fn spawn_capture(
    app: tauri::AppHandle,
    max_seconds: Option<u64>,
    translate_enabled: bool,
    provider_mode: ProviderMode,
) -> CaptureSession {
    let stop = Arc::new(AtomicBool::new(false));
    let stop_for_thread = Arc::clone(&stop);

    // Provider access resolution — Keychain first (Settings UI from Day 18a),
    // ENV fallback (dev convenience), then local secret-file fallback for dev
    // launches from Finder/Spotlight. Hosted mode uses a Bartleby relay token;
    // BYOK mode uses direct Soniox/Upstage keys.
    //
    // Upstage direct (not OpenRouter) — OpenRouter's pooled Upstage account
    // ran out of credit 2026-05-08, indefinite outage. Direct API has same
    // pricing and avoids the routing dependency.
    let relay_token = if provider_mode == ProviderMode::Hosted {
        resolve_key("BARTLEBY_RELAY_TOKEN")
    } else {
        None
    };
    let stt_key = match provider_mode {
        ProviderMode::Hosted => relay_token.as_ref().map(|_| "relay".to_string()),
        ProviderMode::Byok => resolve_key("SONIOX_API_KEY"),
    };
    let upstage_key = match provider_mode {
        ProviderMode::Hosted => relay_token.clone(),
        ProviderMode::Byok => resolve_key("UPSTAGE_API_KEY"),
    };
    let stt_route = match provider_mode {
        ProviderMode::Hosted => relay_token
            .as_ref()
            .map(|token| stt::SttRoute::hosted(relay_ws_url(), token.clone())),
        ProviderMode::Byok => Some(stt::SttRoute::direct()),
    };
    let translate_route = match provider_mode {
        ProviderMode::Hosted => translate::TranslateRoute::hosted(relay_base_url()),
        ProviderMode::Byok => translate::TranslateRoute::direct(),
    };

    // Translator is the upstream consumer of STT finals — start it first so
    // STT can hand it the final-text sender at construction.
    // translate_enabled=false 이면 사용자가 Settings 에서 토글 끔 (한국어 미팅 등) →
    // translator session 안 띄움 + final_tx None → STT 가 finals 만 event 로 emit.
    let (final_tx, translator_session) = match (&stt_key, &upstage_key, translate_enabled) {
        (Some(_), Some(up_key), true) => {
            let (tx, sess) = translate::start(up_key.clone(), translate_route.clone(), app.clone());
            (Some(tx), Some(sess))
        }
        (Some(_), Some(_), false) => {
            println!(
                "[translate] translate_enabled=false — Korean translation disabled by user pref"
            );
            (None, None)
        }
        (Some(_), None, _) => {
            println!("[translate] UPSTAGE_API_KEY not set — Korean translation disabled (English-only captions)");
            (None, None)
        }
        _ => (None, None),
    };

    // Phase 5 S1 — Live 30s summary tick disabled. The live SummaryPanel was
    // removed (advisor + Hyprnote precedent: meeting info value comes from
    // *finalize-only* enhance, not from a streaming "working title" theatre).
    // `summary` module is kept for the upcoming Phase 5 S2 `finalize.rs` —
    // a single batch call on Stop replaces the 30s tick.
    let _ = &upstage_key;
    let summary_session: Option<summary::SummarySession> = None;

    // Phase 6 S3 — two parallel Soniox sessions, one per audio source.
    // - sys (system audio): English-leaning lecture/podcast content, hands
    //   English finals to the translator for Korean caption.
    // - mic (user voice): mixed-language conversational content, no
    //   translation by default (the user speaking their own language doesn't
    //   need to be translated to itself).
    // Soniox's protocol has no per-channel labeling on a stereo stream, so
    // sending sys+mic as one stereo session would collapse on the server's
    // single endpoint detector — empirically observed: finals lag ~7s when
    // streams are merged. Two parallel sessions cost 2x ($0.0072/min) but
    // keep endpointing per-source.
    let (stt_sys_sender, stt_sys_session, stt_mic_sender, stt_mic_session) =
        match (&stt_key, &stt_route) {
            (Some(key), Some(route)) => {
                let (sys_tx, sys_sess) = stt::start(
                    key.clone(),
                    route.clone(),
                    app.clone(),
                    stt::SttSource::Sys,
                    final_tx,
                );
                let (mic_tx, mic_sess) = stt::start(
                    key.clone(),
                    route.clone(),
                    app.clone(),
                    stt::SttSource::Mic,
                    None, // mic finals stay in their own language; no translate path
                );
                (Some(sys_tx), Some(sys_sess), Some(mic_tx), Some(mic_sess))
            }
            _ => {
                println!(
                    "[capture] provider STT token/key not set — STT disabled (caption unavailable)"
                );
                (None, None, None, None)
            }
        };

    let handle = std::thread::spawn(move || {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();

        // Phase 6 S5 — persist Opus segments under the app data dir so a
        // session's audio survives reboots and is discoverable for future
        // playback. Falls back to /tmp if the app data dir is unavailable.
        let audio_root = tauri::Manager::path(&app)
            .app_data_dir()
            .ok()
            .map(|p| p.join("audio").join(timestamp.to_string()))
            .unwrap_or_else(|| std::env::temp_dir().join(format!("bartleby-{}", timestamp)));
        let _ = std::fs::create_dir_all(&audio_root);

        let system_base = audio_root.join("sys");
        let mic_base = audio_root.join("mic");
        let rss_log = audio_root.join("rss.log");

        capture::system_audio::capture_dual_to_opus(
            stop_for_thread,
            max_seconds,
            &system_base,
            &mic_base,
            &rss_log,
            stt_sys_sender,
            stt_mic_sender,
            &app,
        )
        .map_err(|e| e.to_string())
    });
    CaptureSession {
        stop,
        handle,
        stt_sys: stt_sys_session,
        stt_mic: stt_mic_session,
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

/// Start an indefinite capture. The session lives in app state until
/// `stop_capture` is called. Errors if a capture is already in progress.
#[tauri::command]
async fn start_capture(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    translate_enabled: bool,
    provider_mode: Option<String>,
) -> Result<(), String> {
    if !capture::permission::recording_ready() {
        return Err(
            "Recording permissions are missing. Grant Microphone and Screen Recording in the first-run checklist or macOS System Settings."
                .into(),
        );
    }

    let mut guard = state.capture.lock().unwrap();
    if guard.is_some() {
        return Err("Capture already in progress".into());
    }
    let provider_mode = ProviderMode::from_option(provider_mode);
    match provider_mode {
        ProviderMode::Hosted if resolve_key("BARTLEBY_RELAY_TOKEN").is_none() => {
            return Err(
                "Bartleby hosted token is missing. Add it in Settings → Keys, or switch to BYOK."
                    .into(),
            );
        }
        ProviderMode::Byok
            if resolve_key("SONIOX_API_KEY").is_none()
                || resolve_key("UPSTAGE_API_KEY").is_none() =>
        {
            return Err(
                "Soniox and Upstage keys are required in BYOK mode. Add them in Settings → Keys."
                    .into(),
            );
        }
        _ => {}
    }
    *guard = Some(spawn_capture(app, None, translate_enabled, provider_mode));
    Ok(())
}

/// Signal the running capture to stop and join the thread, returning stats.
#[tauri::command]
async fn stop_capture(state: State<'_, AppState>) -> Result<CaptureStats, String> {
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
        if let Some(stt) = session.stt_sys {
            join_stt(stt);
        }
        if let Some(stt) = session.stt_mic {
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
            return Ok(KeyStatus {
                present: true,
                source: Some("keychain"),
            });
        }
    }
    if let Ok(v) = std::env::var(&name) {
        if !v.is_empty() {
            return Ok(KeyStatus {
                present: true,
                source: Some("env"),
            });
        }
    }
    if load_secret_file(&name).is_some() {
        return Ok(KeyStatus {
            present: true,
            source: Some("file"),
        });
    }
    Ok(KeyStatus {
        present: false,
        source: None,
    })
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
        "BARTLEBY_RELAY_TOKEN" => verify_relay_token(&value).await,
        other => Err(format!("Unknown key: {other}")),
    }
}

async fn verify_relay_token(token: &str) -> Result<(), String> {
    let url = format!("{}/v1/auth/check", relay_base_url());
    let resp = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("http client: {e}"))?
        .get(url)
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;
    let status = resp.status();
    if status.is_success() {
        return Ok(());
    }
    if status == reqwest::StatusCode::UNAUTHORIZED {
        return Err("Bartleby relay rejected the token (401)".into());
    }
    let body_text = resp.text().await.unwrap_or_default();
    Err(format!(
        "HTTP {}: {}",
        status,
        body_text.chars().take(200).collect::<String>()
    ))
}

#[tauri::command]
async fn finalize_session(
    transcript: Vec<summary::finalize::InputUtterance>,
    provider_mode: Option<String>,
) -> Result<summary::finalize::FinalizeResult, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| format!("http client: {e}"))?;
    match ProviderMode::from_option(provider_mode) {
        ProviderMode::Hosted => {
            let token = resolve_key("BARTLEBY_RELAY_TOKEN")
                .ok_or_else(|| "BARTLEBY_RELAY_TOKEN not set".to_string())?;
            summary::finalize::finalize_session_hosted(
                &client,
                &relay_base_url(),
                &token,
                &transcript,
            )
            .await
        }
        ProviderMode::Byok => {
            let api_key = resolve_key("UPSTAGE_API_KEY")
                .ok_or_else(|| "UPSTAGE_API_KEY not set".to_string())?;
            summary::finalize::finalize_session(&client, &api_key, &transcript).await
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn init_file_logging() {
    use std::os::unix::io::AsRawFd;
    if std::env::var("RUST_BACKTRACE").is_err() {
        std::env::set_var("RUST_BACKTRACE", "full");
    }
    let Some(home) = std::env::var_os("HOME") else {
        return;
    };
    let log_dir = std::path::PathBuf::from(home).join("Library/Logs/Bartleby");
    if std::fs::create_dir_all(&log_dir).is_err() {
        return;
    }
    let log_path = log_dir.join("debug.log");
    let Ok(file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
    else {
        return;
    };
    let fd = file.as_raw_fd();
    unsafe {
        libc::dup2(fd, libc::STDOUT_FILENO);
        libc::dup2(fd, libc::STDERR_FILENO);
    }
    std::mem::forget(file);
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    println!(
        "\n=== Bartleby session @ unix_ts={ts} pid={} ===",
        std::process::id()
    );
    eprintln!("[log] → {}", log_path.display());
    std::panic::set_hook(Box::new(|info| {
        let bt = std::backtrace::Backtrace::force_capture();
        eprintln!("\n[PANIC] {info}\n[BACKTRACE]\n{bt}\n");
    }));
}

pub fn run() {
    init_file_logging();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:bartleby.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "create sessions table",
                        sql: "CREATE TABLE IF NOT EXISTS sessions (\
                            id INTEGER PRIMARY KEY, \
                            started_at INTEGER NOT NULL, \
                            ended_at INTEGER NOT NULL, \
                            duration_sec INTEGER NOT NULL, \
                            title TEXT NOT NULL, \
                            preview TEXT, \
                            summary TEXT, \
                            transcript_json TEXT NOT NULL, \
                            stats_json TEXT NOT NULL, \
                            audio_dir TEXT, \
                            created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), \
                            updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000), \
                            deleted_at INTEGER\
                        ); CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at); CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at);",
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }],
                )
                .build(),
        )
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
            start_capture,
            stop_capture,
            api_key_status,
            save_api_key,
            clear_api_key,
            verify_api_key,
            finalize_session,
            log_frontend,
            list_audio_segments,
            storage_status,
            open_storage_folder,
            cleanup_old_audio,
            recording_permission_status,
            request_microphone_permission,
            request_screen_recording_permission,
            open_microphone_settings,
            open_screen_recording_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
