//! Solar Pro 3 batch meeting summarization.
//!
//! Subscribes to `stt_final` events emitted by the STT pipeline (via
//! `app.listen`), accumulates finalized English text into an in-memory
//! transcript buffer, and every 30 seconds — debounced on "no new finals
//! since last summary" so we don't repeat-summarise identical state —
//! calls Upstage Solar Pro 3 to produce a structured JSON summary:
//!
//!   - working_title: short editorial title (≤8 words)
//!   - themes: 3-5 thematic bullets (Korean preferred)
//!   - quote_candidate: most insight-dense line verbatim, or null
//!
//! Emits `summary_update` events the SummaryPanel listens to.
//!
//! Cost back-of-envelope: 60min × 2 calls/min × ~3K transcript tokens in
//! ≈ $0.10/h. Drops further once the system prompt hits Upstage's
//! cached-input tier ($0.015/M).

pub mod upstage;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde::Deserialize;
use tauri::{AppHandle, Emitter, Listener};

pub use upstage::SummaryResult;

pub struct SummarySession {
    pub cancel: Arc<AtomicBool>,
    pub join: std::thread::JoinHandle<()>,
}

#[derive(Deserialize)]
struct SttFinalPayload {
    text: String,
}

/// Start a summary session. Listens to `stt_final`, summarises every 30s
/// with no-new-finals debounce, emits `summary_update`.
pub fn start(api_key: String, app: AppHandle) -> SummarySession {
    let cancel = Arc::new(AtomicBool::new(false));
    let cancel_for_thread = Arc::clone(&cancel);

    let join = std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("[summary] failed to build tokio runtime");

        rt.block_on(async move {
            let buffer: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
            let buf_for_listen = Arc::clone(&buffer);

            // Subscribe to stt_final on the event bus. Closure is sync — it
            // just locks the buffer and pushes. The listen handler stays
            // registered for the lifetime of the session and is removed
            // explicitly before the thread exits (so per-capture cycles
            // don't leak handlers).
            let listen_id = app.listen("stt_final", move |event| {
                if let Ok(p) = serde_json::from_str::<SttFinalPayload>(event.payload()) {
                    if let Ok(mut buf) = buf_for_listen.lock() {
                        buf.push(p.text);
                    }
                }
            });

            let client = match reqwest::Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
            {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("[summary] reqwest client build failed: {e}");
                    app.unlisten(listen_id);
                    return;
                }
            };

            println!("[summary] ready (model=solar-pro3, cadence=30s, debounced)");
            let mut last_summarized_count: usize = 0;
            // Coarse tick (500ms) so cancellation is responsive while real
            // summarisation work happens every 30s (60 ticks).
            let mut ticks: u64 = 0;
            const TICK_MS: u64 = 500;
            const SUMMARIZE_EVERY_TICKS: u64 = 30_000 / TICK_MS;

            loop {
                tokio::time::sleep(Duration::from_millis(TICK_MS)).await;
                if cancel_for_thread.load(Ordering::SeqCst) {
                    break;
                }
                ticks += 1;
                if ticks % SUMMARIZE_EVERY_TICKS != 0 {
                    continue;
                }

                let snapshot: Vec<String> = match buffer.lock() {
                    Ok(g) => g.clone(),
                    Err(_) => continue,
                };
                if snapshot.len() <= last_summarized_count {
                    continue;
                }
                let transcript = upstage::build_transcript(&snapshot);
                match upstage::summarize(&client, &api_key, &transcript).await {
                    Ok(result) => {
                        last_summarized_count = snapshot.len();
                        let _ = app.emit("summary_update", &result);
                    }
                    Err(e) => {
                        eprintln!("[summary] error: {e}");
                        // Don't bump last_summarized_count — retry next tick.
                    }
                }
            }
            app.unlisten(listen_id);
            println!("[summary] session ended");
        });
    });

    SummarySession { cancel, join }
}

/// Signal the session to stop and join its thread.
pub fn join(session: SummarySession) {
    session.cancel.store(true, Ordering::SeqCst);
    if let Err(e) = session.join.join() {
        eprintln!("[summary] thread panicked: {e:?}");
    }
}
