//! Anonymous early-access registration + recording-usage reporting.
//!
//! On every launch we POST an anonymous machine id + app version to the
//! marketing site backend (heybartleby.com), which records install/active in
//! Neon. This is early-adopter identity for future licensing decisions — NOT a
//! free-forever grant. After each finished recording we also report its
//! duration (seconds) so per-machine usage can be aggregated for cost/pricing.
//!
//! PRIVACY: only a SHA256 of a random per-machine UUID and plain numbers
//! (duration, version) ever leave the device. No audio, transcript, summary,
//! meeting title, or API key. All calls are best-effort and non-fatal — a
//! failed POST never blocks app launch or recording.

use sha2::{Digest, Sha256};

const MACHINE_ID_KEY: &str = "BARTLEBY_MACHINE_ID";
const DEFAULT_SITE_URL: &str = "https://heybartleby.com";

fn site_base_url() -> String {
    std::env::var("BARTLEBY_SITE_URL")
        .ok()
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_SITE_URL.to_string())
}

/// Stable anonymous per-machine identifier: SHA256 hex of a random UUID kept in
/// the macOS Keychain. Generated once on first call, reused after (survives app
/// reinstall, which is desirable for a durable early-adopter record).
fn machine_id_hash() -> Result<String, String> {
    let uuid = match crate::secrets::load(MACHINE_ID_KEY).map_err(|e| e.to_string())? {
        Some(v) if !v.is_empty() => v,
        _ => {
            let new_id = uuid::Uuid::new_v4().to_string();
            crate::secrets::save(MACHINE_ID_KEY, &new_id).map_err(|e| e.to_string())?;
            new_id
        }
    };
    let mut hasher = Sha256::new();
    hasher.update(uuid.as_bytes());
    Ok(format!("{:x}", hasher.finalize()))
}

fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("http client: {e}"))
}

/// Fire once per launch. The backend UPSERTs: first call = new install,
/// later calls = last_seen heartbeat.
pub async fn register() -> Result<(), String> {
    let hash = machine_id_hash()?;
    let body = serde_json::json!({
        "machineIdHash": hash,
        "appVersion": env!("CARGO_PKG_VERSION"),
    });
    client()?
        .post(format!("{}/api/early-access", site_base_url()))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("register request: {e}"))?;
    Ok(())
}

/// Report one finished recording's duration in seconds. Numbers only.
pub async fn record_usage(duration_sec: u64) -> Result<(), String> {
    let hash = machine_id_hash()?;
    let body = serde_json::json!({
        "machineIdHash": hash,
        "durationSec": duration_sec,
        "appVersion": env!("CARGO_PKG_VERSION"),
    });
    client()?
        .post(format!("{}/api/usage", site_base_url()))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("usage request: {e}"))?;
    Ok(())
}
