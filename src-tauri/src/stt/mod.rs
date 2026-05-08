//! Soniox-backed speech-to-text bridge for Bartleby.
//!
//! `start` spawns a dedicated thread that owns a current-thread tokio runtime,
//! receives raw 48kHz interleaved stereo f32 samples from the capture pipeline,
//! resamples to 16kHz mono s16le in 120ms chunks, and streams them to Soniox.
//! Tokens are surfaced via `stt_partial` / `stt_final` / `stt_error` Tauri
//! events that the Overlay window listens to.
//!
//! No reconnect logic in Day 15a — server close ends the session and the
//! frontend shows whatever the last `stt_error` said. Day 15b will add the
//! exponential-backoff reconnect + 30s ring buffer (PLAN.md L329-389).

pub mod resample;
pub mod soniox;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use tauri::AppHandle;

use resample::Resampler;

pub struct SttSession {
    /// Set true to request the websocket task to exit on the next chunk.
    pub stop: Arc<AtomicBool>,
    /// Bridge thread + tokio runtime — joined on `stop_capture`.
    pub join: std::thread::JoinHandle<()>,
}

/// Start a Soniox STT session. Returns the audio fan-out `Sender` (move it
/// into the capture pipeline) and the session handle (used to stop/join).
///
/// Dropping the returned sender flushes remaining samples and closes the
/// websocket — capture-thread teardown does this for us automatically.
pub fn start(
    api_key: String,
    app: AppHandle,
) -> (std::sync::mpsc::Sender<Vec<f32>>, SttSession) {
    let (sample_tx, sample_rx) = std::sync::mpsc::channel::<Vec<f32>>();
    let stop = Arc::new(AtomicBool::new(false));
    let stop_for_thread = Arc::clone(&stop);
    let join = std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("[stt] failed to build tokio runtime");

        rt.block_on(async move {
            let (chunk_tx, chunk_rx) =
                tokio::sync::mpsc::unbounded_channel::<Vec<u8>>();

            // Bridge sync mpsc → resampler → tokio mpsc, on a blocking task so
            // the websocket task isn't starved by the recv loop.
            let bridge_stop = Arc::clone(&stop_for_thread);
            let bridge = tokio::task::spawn_blocking(move || {
                let mut resampler = Resampler::new();
                while !bridge_stop.load(Ordering::SeqCst) {
                    match sample_rx.recv() {
                        Ok(samples) => {
                            for chunk in resampler.push(&samples) {
                                if chunk_tx.send(chunk).is_err() {
                                    return;
                                }
                            }
                        }
                        Err(_) => return, // sender dropped → end of capture
                    }
                }
            });

            if let Err(e) = soniox::run_session(api_key, app, chunk_rx, stop_for_thread).await {
                eprintln!("[stt] session error: {e}");
            }
            // Best-effort wait for bridge thread to wind down. It will return
            // once chunk_tx is dropped (which happens when run_session exits)
            // because send() will fail.
            let _ = bridge.await;
        });
    });

    (sample_tx, SttSession { stop, join })
}
