//! Upstage Solar Pro 3 Korean translation pipeline (Day 16b: streaming).
//!
//! Sequential consumer: pulls English finals from a tokio mpsc channel,
//! translates each via Upstage Solar Pro 3 (direct API, SSE streaming),
//! emits `translation_partial` per delta chunk + `translation_final` on
//! `[DONE]`. `translation_error` on any HTTP/parse/stream failure.
//!
//! Depth-1 sequential by design — order preserved without seq/queue
//! machinery. Day 16b's concurrent depth-8 + contiguous prefix render
//! (PLAN.md L329-389) deferred until live caption flow is validated.

pub mod upstage;

use std::time::Duration;

use tauri::AppHandle;
use tokio::sync::mpsc::UnboundedSender;

#[derive(Clone, Debug)]
pub enum TranslateRoute {
    Direct,
    Hosted { base_url: String },
}

impl TranslateRoute {
    pub fn direct() -> Self {
        Self::Direct
    }

    pub fn hosted(base_url: String) -> Self {
        Self::Hosted {
            base_url: base_url.trim_end_matches('/').to_string(),
        }
    }
}

pub struct TranslatorSession {
    /// Bridge thread + tokio runtime — joined on capture stop.
    pub join: std::thread::JoinHandle<()>,
}

/// Start a translator session and return the English-final sender alongside
/// the session handle. The sender is moved into the STT module so each
/// `stt_final` text goes through us before falling on the floor.
pub fn start(
    api_key: String,
    route: TranslateRoute,
    app: AppHandle,
) -> (UnboundedSender<String>, TranslatorSession) {
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

            println!("[translate] ready (model=solar-pro3, streaming, sequential depth=1)");
            while let Some(en) = final_rx.recv().await {
                upstage::translate_and_emit(&client, &api_key, &route, &app, en).await;
            }
            println!("[translate] session ended");
        });
    });
    (final_tx, TranslatorSession { join })
}
