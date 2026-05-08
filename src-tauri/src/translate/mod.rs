//! Upstage Solar Pro 3 Korean translation pipeline (Day 16a).
//!
//! Sequential consumer: pulls English finals from a tokio mpsc channel,
//! translates each via Upstage Solar Pro 3 (direct API), emits
//! `translation_final` / `translation_error` Tauri events.
//!
//! Day 16a is depth-1 (one translation in flight at a time). Order is
//! preserved by design — no seq/queue machinery yet. Day 16b will add the
//! concurrent depth-8 + seq + contiguous prefix render per PLAN.md
//! L329-389.

pub mod upstage;

use std::time::Duration;

use tauri::AppHandle;
use tokio::sync::mpsc::UnboundedSender;

pub struct TranslatorSession {
    /// Bridge thread + tokio runtime — joined on capture stop.
    pub join: std::thread::JoinHandle<()>,
}

/// Start a translator session and return the English-final sender alongside
/// the session handle. The sender is moved into the STT module so each
/// `stt_final` text goes through us before falling on the floor.
pub fn start(api_key: String, app: AppHandle) -> (UnboundedSender<String>, TranslatorSession) {
    let (final_tx, mut final_rx) = tokio::sync::mpsc::unbounded_channel::<String>();
    let join = std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("[translate] failed to build tokio runtime");

        rt.block_on(async move {
            let client = match reqwest::Client::builder()
                .timeout(Duration::from_secs(15))
                .build()
            {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("[translate] reqwest client build failed: {e}");
                    return;
                }
            };

            println!("[translate] ready (model=solar-pro3, sequential depth=1)");
            while let Some(en) = final_rx.recv().await {
                upstage::translate_and_emit(&client, &api_key, &app, en).await;
            }
            println!("[translate] session ended");
        });
    });
    (final_tx, TranslatorSession { join })
}
