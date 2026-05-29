//! Microphone-only capture for dictation (push-to-talk).
//!
//! The meeting path (`system_audio::capture_dual_to_opus`) captures system
//! audio + mic and writes Opus segments. Dictation needs *only* the user's
//! voice streamed to STT — no system audio, no Opus files. This helper reuses
//! the same mic sources the meeting path uses (`mic_avengine` sidecar, with
//! `mic` cpal as fallback) but routes samples to a single STT sender.
//!
//! The mic sources fan out to two channels: a `sample_tx` (normally the Opus
//! encoder) and an optional `stt_sender`. For dictation we have no encoder, so
//! `sample_tx` feeds a discard drain thread — `mic_avengine` bails its reader
//! loop the moment `sample_tx.send` errors, so the receiver must stay alive.
//!
//! The live mic stream is owned by a dedicated capture thread and never leaves
//! it. `cpal::Stream` (the fallback path) is `!Send`, so it cannot live in the
//! Tauri-managed `AppState`; confining it to one thread keeps `MicOnlyCapture`
//! `Send`. The handle returned here carries only a stop flag + join handle.
//!
//! Lifecycle: dropping `MicOnlyCapture` flips the stop flag and joins the
//! capture thread, which drops the mic stream (killing the sidecar / stopping
//! the cpal stream) and lets the discard drain thread exit.

use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::thread::JoinHandle;
use std::time::Duration;

/// A running mic-only capture. Drop to stop. `Send` because the non-`Send`
/// `cpal::Stream` is confined to the capture thread and never stored here.
pub struct MicOnlyCapture {
    stop: Arc<AtomicBool>,
    capture: Option<JoinHandle<()>>,
}

impl Drop for MicOnlyCapture {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Relaxed);
        if let Some(handle) = self.capture.take() {
            let _ = handle.join();
        }
    }
}

/// Start mic-only capture feeding `stt_sender` (and only `stt_sender`).
///
/// Tries the AVAudioEngine sidecar first (the meeting path's primary source),
/// falling back to cpal if the sidecar can't start. System-audio crosstalk
/// gating is disabled here (no system audio is playing through Bartleby in a
/// dictation session), so the sidecar's `sys_peak_bits` is a constant zero —
/// the STT gate never engages.
///
/// Returns once the mic source has successfully started (or errors if neither
/// source could start). The mic stream then runs on the spawned thread until
/// the returned handle is dropped.
pub fn start(stt_sender: Sender<Vec<f32>>) -> Result<MicOnlyCapture, String> {
    let stop = Arc::new(AtomicBool::new(false));
    let stop_for_thread = Arc::clone(&stop);

    // The capture thread reports start success/failure back so the caller can
    // surface a clear error instead of a silently-dead session.
    let (ready_tx, ready_rx) = std::sync::mpsc::channel::<Result<(), String>>();

    let capture = std::thread::spawn(move || {
        // Discard channel for the mic source's `sample_tx` fan-out (no Opus
        // encoding in dictation). The drain thread keeps the receiver alive so
        // `mic_avengine`'s reader loop doesn't bail on the first `send`.
        let (sample_tx, sample_rx) = std::sync::mpsc::channel::<Vec<f32>>();
        let discard = std::thread::spawn(move || while sample_rx.recv().is_ok() {});

        // No system audio → sys peak stays zero → crosstalk gate never engages.
        let sys_peak_bits = Arc::new(AtomicU32::new(0));

        // Hold the active stream in a thread-local enum so it lives for the
        // duration of the capture loop and is dropped here (on this thread).
        enum Source {
            Engine(super::mic_avengine::MicEngineStream),
            Cpal(super::mic::MicStream),
        }

        let source = match super::mic_avengine::start(
            sample_tx.clone(),
            Some(stt_sender.clone()),
            Arc::clone(&sys_peak_bits),
            Arc::clone(&stop_for_thread),
        ) {
            Ok(engine) => Some(Source::Engine(engine)),
            Err(e) => {
                eprintln!("[dictation mic] sidecar start failed ({e}); falling back to cpal");
                match super::mic::start(
                    sample_tx.clone(),
                    Some(stt_sender),
                    Arc::clone(&stop_for_thread),
                ) {
                    Ok(cpal) => Some(Source::Cpal(cpal)),
                    Err(e2) => {
                        let _ = ready_tx
                            .send(Err(format!("mic capture failed (sidecar: {e}; cpal: {e2})")));
                        return;
                    }
                }
            }
        };

        // Drop our local `sample_tx` now that the active source owns its own
        // clone. Otherwise this original sender stays alive for the whole
        // capture loop, so the discard drain thread's `recv()` never returns
        // Err and `discard.join()` below would block forever (hanging
        // `drop(mic)` on stop → no injection). After this, the only remaining
        // senders are the source's clone(s), which drop when the source stops.
        drop(sample_tx);

        let _ = ready_tx.send(Ok(()));

        // Keep the stream alive until stop is signalled.
        while !stop_for_thread.load(Ordering::Relaxed) {
            std::thread::sleep(Duration::from_millis(50));
        }

        // Drop the mic stream on this thread (kills sidecar / stops cpal),
        // closing `sample_tx` so the discard thread exits.
        drop(source);
        let _ = discard.join();
    });

    match ready_rx.recv() {
        Ok(Ok(())) => Ok(MicOnlyCapture {
            stop,
            capture: Some(capture),
        }),
        Ok(Err(e)) => {
            let _ = capture.join();
            Err(e)
        }
        Err(_) => {
            let _ = capture.join();
            Err("mic capture thread exited before reporting status".into())
        }
    }
}
