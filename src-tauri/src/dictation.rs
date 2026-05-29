//! Push-to-talk dictation orchestration.
//!
//! Holding the global dictation hotkey starts a mic-only capture → Soniox STT
//! session; releasing it stops capture, waits briefly for trailing finals, and
//! injects the accumulated raw transcript at the cursor of the frontmost app
//! via `inject::inject_text`.
//!
//! Unlike the meeting path there is no Opus recording and no system audio —
//! just the user's voice streamed to STT (`capture::mic_dictation`). Finals
//! are received in Rust over an `mpsc::Sender<String>` plumbed through
//! `stt::start`, accumulated, and concatenated on stop.
//!
//! Cold start: the Soniox websocket takes ~1s to connect, but the user speaks
//! the instant they press. The STT bridge buffers pre-connect audio (std mpsc
//! + 30s ring) and the writer loop flushes it once the socket is ready, so the
//! first word isn't lost (see `stt/soniox.rs` first-connect replay note). We
//! connect on press and never hold an idle socket between dictations.

use std::sync::mpsc::Receiver;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::capture::mic_dictation::MicOnlyCapture;
use crate::{stt, AppState};

/// How long to wait after stop for Soniox to flush trailing finals. The STT
/// teardown sends EOS and waits on the server's close (up to 5s); we bound the
/// drain so a slow/dropped socket can't hang the release.
const FINAL_FLUSH_TIMEOUT: Duration = Duration::from_secs(5);
/// Poll cadence while draining trailing finals.
const FINAL_DRAIN_TICK: Duration = Duration::from_millis(50);

/// Live dictation session state. Held in `AppState` behind a mutex. Present iff
/// a PTT session is currently active (hotkey held).
pub struct DictationSession {
    mic: MicOnlyCapture,
    stt: stt::SttSession,
    /// Receives finalized transcript text from the STT reader task.
    final_rx: Receiver<String>,
    /// Finals accumulated so far (also drained on stop).
    accumulated: String,
}

/// Payload for the `dictation_state` event the overlay subscribes to.
#[derive(Debug, Clone, Serialize)]
pub struct DictationState {
    pub state: &'static str,
}

/// Payload for the `dictation_error` event — surfaced when injection can't
/// proceed (e.g. Accessibility not granted) so the UI can prompt the user.
#[derive(Debug, Clone, Serialize)]
pub struct DictationError {
    pub code: &'static str,
    pub message: String,
}

/// Whether a dictation session is currently active.
pub fn is_active(app: &AppHandle) -> bool {
    let state = app.state::<AppState>();
    let active = state.dictation.lock().unwrap().is_some();
    active
}

/// Start a push-to-talk dictation session. Idempotent: if one is already
/// active this is a no-op (Carbon global hotkeys repeat `Pressed` while held).
pub fn start(app: &AppHandle) {
    let state = app.state::<AppState>();
    let mut guard = state.dictation.lock().unwrap();
    if guard.is_some() {
        // Hotkey auto-repeat while held — already listening.
        return;
    }

    // Resolve STT route the same way meetings do (hosted relay vs BYOK).
    let (api_key, route) = match crate::resolve_dictation_stt_route() {
        Some(pair) => pair,
        None => {
            eprintln!("[dictation] no STT key/token configured — cannot start");
            let _ = app.emit(
                "dictation_error",
                DictationError {
                    code: "no_stt_key",
                    message: "No STT key configured. Add a Bartleby token or Soniox key in Settings → Keys.".into(),
                },
            );
            return;
        }
    };

    // Final-text channel: STT reader task → this session.
    let (final_tx, final_rx) = std::sync::mpsc::channel::<String>();

    // STT session (mic source). Returns the audio sender we feed mic samples
    // into, plus the session handle.
    let (sample_tx, stt_session) = stt::start(
        api_key,
        route,
        app.clone(),
        stt::SttSource::Mic,
        Some(final_tx),
    );

    // Mic-only capture → STT. If this fails, tear down the STT session we just
    // started (dropping the sample sender closes its socket).
    let mic = match crate::capture::mic_dictation::start(sample_tx) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("[dictation] mic capture failed: {e}");
            crate::join_stt(stt_session);
            let _ = app.emit(
                "dictation_error",
                DictationError {
                    code: "mic_failed",
                    message: e,
                },
            );
            return;
        }
    };

    *guard = Some(DictationSession {
        mic,
        stt: stt_session,
        final_rx,
        accumulated: String::new(),
    });
    drop(guard);

    println!("[dictation] listening");
    let _ = app.emit("dictation_state", DictationState { state: "listening" });
}

/// Stop the active session, flush trailing finals, and inject the accumulated
/// text. No-op if no session is active. Runs the (blocking) STT join + drain
/// on a background thread so the hotkey handler returns immediately.
pub fn stop(app: &AppHandle) {
    let state = app.state::<AppState>();
    let Some(session) = state.dictation.lock().unwrap().take() else {
        // No active session (e.g. release without a tracked press).
        return;
    };

    // Emit `idle` immediately so the overlay hides the instant Fn is released —
    // the join/drain/inject below take up to ~5s on the worker thread, and we
    // don't want the "받아쓰는 중" overlay lingering for them. Only emitted when a
    // session actually existed (the early return above preserves the no-op case).
    let _ = app.emit("dictation_state", DictationState { state: "idle" });

    let app = app.clone();
    std::thread::spawn(move || {
        finish_session(&app, session);
    });
}

/// Tear down a session on a worker thread: stop mic + STT, drain trailing
/// finals, concatenate, and inject.
fn finish_session(app: &AppHandle, session: DictationSession) {
    // 1. Stop the mic first so no new audio is sent, then join STT. The STT
    //    teardown flushes EOS and waits on the server's trailing finals, which
    //    the reader task forwards into `final_rx` — so we MUST join before the
    //    final drain below, or we'd miss the last words.
    let DictationSession {
        mic,
        stt,
        final_rx,
        mut accumulated,
    } = session;
    drop(mic);
    crate::join_stt(stt);

    // 2. Drain any finals still queued. After join the reader task is done, so
    //    everything it sent is already in the channel; the timeout is a guard
    //    against an unexpectedly slow teardown.
    let deadline = std::time::Instant::now() + FINAL_FLUSH_TIMEOUT;
    loop {
        match final_rx.try_recv() {
            Ok(text) => accumulated.push_str(&text),
            Err(std::sync::mpsc::TryRecvError::Empty) => {
                if std::time::Instant::now() >= deadline {
                    break;
                }
                std::thread::sleep(FINAL_DRAIN_TICK);
            }
            Err(std::sync::mpsc::TryRecvError::Disconnected) => break,
        }
    }

    let text = accumulated.trim().to_string();
    println!("[dictation] stopped — {} chars to inject", text.chars().count());
    // `idle` is already emitted by `stop()` when the session is taken, so the
    // overlay hides immediately on release — don't re-emit here.

    if text.is_empty() {
        return;
    }

    // 3. Inject — requires Accessibility. Without it CGEventPost is silently
    //    dropped, so don't pretend it worked; surface an error for the UI.
    if !crate::inject::accessibility_trusted() {
        eprintln!("[dictation] accessibility not trusted — cannot inject");
        let _ = app.emit(
            "dictation_error",
            DictationError {
                code: "accessibility_not_trusted",
                message: "Enable Accessibility for Bartleby in System Settings to inject dictated text.".into(),
            },
        );
        return;
    }

    if let Err(e) = crate::inject::inject_text(&text) {
        eprintln!("[dictation] inject failed: {e}");
        let _ = app.emit(
            "dictation_error",
            DictationError {
                code: "inject_failed",
                message: e,
            },
        );
    }
}
