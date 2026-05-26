//! Soniox-backed speech-to-text bridge for Bartleby.
//!
//! `start` spawns a dedicated thread that owns a current-thread tokio runtime,
//! receives raw 48kHz interleaved stereo f32 samples from the capture pipeline,
//! resamples to 16kHz mono s16le in 120ms chunks, and streams them to Soniox.
//! Tokens are surfaced via `stt_partial` / `stt_final` / `stt_error` Tauri
//! events that the Overlay window listens to.
//!
//! Day 15b: the websocket session is wrapped in a reconnect loop with
//! exponential backoff (1→2→4→8→max 30s, cap 10 attempts). A 30s ring
//! buffer of resampled chunks is replayed into the new session so a Wi-Fi
//! blip or Soniox idle disconnect doesn't lose recent speech. The loop
//! emits `stt_error` with `code: "reconnecting" | "aborted"` so the
//! frontend can surface the state machine.

pub mod resample;
pub mod ring;
pub mod soniox;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use tauri::{AppHandle, Emitter};

use resample::Resampler;
use ring::AudioRing;
pub use soniox::SttSource;
use soniox::{SessionEnd, SttError};

#[derive(Clone, Debug)]
pub struct SttRoute {
    pub ws_url: String,
    pub authorization: Option<String>,
}

impl SttRoute {
    pub fn direct() -> Self {
        Self {
            ws_url: soniox::SONIOX_WS_URL.to_string(),
            authorization: None,
        }
    }

    pub fn hosted(ws_url: String, token: String) -> Self {
        Self {
            ws_url,
            authorization: Some(format!("Bearer {token}")),
        }
    }
}

/// Cap on consecutive reconnect attempts before giving up. With backoff
/// 1→2→4→8→16→30→30→30→30→30s this gives ~3.3 min of recovery window.
const MAX_RECONNECT_ATTEMPTS: u32 = 10;
/// Maximum backoff between attempts. Past this, every retry is one
/// `MAX_BACKOFF_SECS`-second wait.
const MAX_BACKOFF_SECS: u64 = 30;

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
///
/// `final_tx` is an optional sink for finalized English text — when set,
/// every `stt_final` event also forwards its text to the translator
/// pipeline (Day 16a).
pub fn start(
    api_key: String,
    route: SttRoute,
    app: AppHandle,
    source: SttSource,
    final_tx: Option<tokio::sync::mpsc::UnboundedSender<String>>,
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
            let (chunk_tx, chunk_rx) = tokio::sync::mpsc::unbounded_channel::<Vec<u8>>();
            let ring = Arc::new(Mutex::new(AudioRing::new()));

            // Bridge: sync mpsc → resampler → ring + tokio mpsc, on a
            // blocking task so the websocket task isn't starved by recv.
            // Every chunk lands in the ring (last 30s, auto-evicted) AND
            // the live consumer channel; the ring is what gets replayed
            // when a reconnect happens.
            let bridge_stop = Arc::clone(&stop_for_thread);
            let ring_for_bridge = Arc::clone(&ring);
            let bridge = tokio::task::spawn_blocking(move || {
                let mut resampler = Resampler::new();
                while !bridge_stop.load(Ordering::SeqCst) {
                    match sample_rx.recv() {
                        Ok(samples) => {
                            for chunk in resampler.push(&samples) {
                                if let Ok(mut r) = ring_for_bridge.lock() {
                                    r.push(chunk.clone());
                                }
                                if chunk_tx.send(chunk).is_err() {
                                    return;
                                }
                            }
                        }
                        Err(_) => return, // sender dropped → end of capture
                    }
                }
            });

            run_with_reconnect(
                api_key,
                route,
                app,
                chunk_rx,
                stop_for_thread,
                final_tx,
                ring,
                source,
            )
            .await;

            // Best-effort wait for bridge thread to wind down. It will
            // return once chunk_tx is dropped (run_with_reconnect exited).
            let _ = bridge.await;
        });
    });

    (sample_tx, SttSession { stop, join })
}

/// Wrap `soniox::run_session` in a reconnect loop with exponential backoff.
/// Each attempt drains the ring as the new session's first frames. Pending
/// chunks queued in `chunk_rx` during the backoff sleep are discarded so
/// the new session doesn't double-send what's already in the ring.
async fn run_with_reconnect(
    api_key: String,
    route: SttRoute,
    app: AppHandle,
    mut chunk_rx: tokio::sync::mpsc::UnboundedReceiver<Vec<u8>>,
    stop: Arc<AtomicBool>,
    final_tx: Option<tokio::sync::mpsc::UnboundedSender<String>>,
    ring: Arc<Mutex<AudioRing>>,
    source: SttSource,
) {
    let mut attempt: u32 = 0;
    loop {
        if stop.load(Ordering::SeqCst) {
            break;
        }

        let outcome = soniox::run_session(
            &api_key,
            &route,
            &app,
            &mut chunk_rx,
            &stop,
            final_tx.clone(),
            &ring,
            source,
        )
        .await;

        let drop_reason = match outcome {
            Ok(SessionEnd::Stopped) | Ok(SessionEnd::Finished) => break,
            Ok(SessionEnd::Dropped(reason)) => reason,
            Err(e) => format!("{e:#}"),
        };

        attempt += 1;
        if attempt > MAX_RECONNECT_ATTEMPTS {
            let _ = app.emit(
                "stt_error",
                SttError {
                    code: Some("aborted".into()),
                    message: format!(
                        "Reconnect cap reached ({} attempts): {}",
                        MAX_RECONNECT_ATTEMPTS, drop_reason
                    ),
                    source,
                },
            );
            break;
        }

        let backoff_secs = backoff_seconds(attempt);
        eprintln!(
            "[stt {:?}] dropped ({}). reconnect attempt {} in {}s",
            source, drop_reason, attempt, backoff_secs
        );
        let _ = app.emit(
            "stt_error",
            SttError {
                code: Some("reconnecting".into()),
                message: format!(
                    "Connection lost ({}). Retrying in {}s (attempt {}/{})",
                    drop_reason, backoff_secs, attempt, MAX_RECONNECT_ATTEMPTS
                ),
                source,
            },
        );

        // Sleep with stop-awareness + drain stale chunks. The ring already
        // owns the last 30s of audio, so anything queued in chunk_rx now is
        // either still in the ring (replay covers it) or older than the
        // ring's window (so dropping is correct).
        sleep_with_drain(&mut chunk_rx, &stop, Duration::from_secs(backoff_secs)).await;
        if stop.load(Ordering::SeqCst) {
            break;
        }
    }
}

fn backoff_seconds(attempt: u32) -> u64 {
    // 1, 2, 4, 8, 16, 30, 30, … (cap at MAX_BACKOFF_SECS).
    // attempt is 1-based; saturating_pow handles overflow on extreme attempts.
    let raw = 2_u64.saturating_pow(attempt.saturating_sub(1));
    raw.min(MAX_BACKOFF_SECS)
}

async fn sleep_with_drain(
    chunk_rx: &mut tokio::sync::mpsc::UnboundedReceiver<Vec<u8>>,
    stop: &Arc<AtomicBool>,
    duration: Duration,
) {
    let deadline = tokio::time::Instant::now() + duration;
    loop {
        if stop.load(Ordering::SeqCst) {
            return;
        }
        let now = tokio::time::Instant::now();
        if now >= deadline {
            return;
        }
        let remaining = deadline - now;
        // Tick every 200ms so stop signals get noticed quickly. Drain any
        // chunks that arrive during the tick — they're stale w.r.t. the ring.
        let tick = remaining.min(Duration::from_millis(200));
        tokio::select! {
            _ = tokio::time::sleep(tick) => {},
            chunk = chunk_rx.recv() => {
                if chunk.is_none() {
                    // Capture sender dropped — caller will see this on next
                    // session and exit through SessionEnd::Stopped.
                    return;
                }
                // else: discard the chunk and keep waiting.
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backoff_doubles_then_caps() {
        assert_eq!(backoff_seconds(1), 1);
        assert_eq!(backoff_seconds(2), 2);
        assert_eq!(backoff_seconds(3), 4);
        assert_eq!(backoff_seconds(4), 8);
        assert_eq!(backoff_seconds(5), 16);
        // 2^5 = 32 → capped to 30
        assert_eq!(backoff_seconds(6), MAX_BACKOFF_SECS);
        assert_eq!(backoff_seconds(7), MAX_BACKOFF_SECS);
        assert_eq!(backoff_seconds(50), MAX_BACKOFF_SECS);
    }
}
