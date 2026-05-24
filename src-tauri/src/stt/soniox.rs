//! Soniox real-time STT WebSocket client (v4 model).
//!
//! Drives a single transcription session: opens the websocket, sends initial
//! config, replays any buffered audio from the ring, then forwards 120ms
//! s16le chunks coming in over the live tokio mpsc. Tokens fan out as
//! `stt_partial` / `stt_final` / `stt_error` Tauri events.
//!
//! `run_session` is reconnect-aware (Day 15b) — returns `SessionEnd` so the
//! caller can decide between a clean exit and a backoff retry. The chunk
//! receiver and the ring are passed by reference so they survive across
//! reconnect attempts.

use anyhow::{Context, Result};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc::UnboundedReceiver;
use tokio_tungstenite::{connect_async, tungstenite::Message};

use super::ring::AudioRing;

const SONIOX_WS_URL: &str = "wss://stt-rt.soniox.com/transcribe-websocket";
const TARGET_SAMPLE_RATE: u32 = 16_000;

/// Which audio source a Soniox session is transcribing. Frontend uses this
/// to decide speaker label (mic → "user", sys → "system") and route partials
/// independently so the two channels don't clobber each other's caption.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SttSource {
    Sys,
    Mic,
}

/// How a single websocket session ended. The reconnect loop treats `Stopped`
/// and `Finished` as terminal, `Dropped` as retryable.
#[derive(Debug)]
pub enum SessionEnd {
    /// Stop signal flipped or chunk channel closed cleanly.
    Stopped,
    /// Server reported `finished:true` (clean EOS).
    Finished,
    /// Server-side close, recv error, or send error mid-session.
    Dropped(String),
}

/// Payload emitted to the frontend on a partial token batch — replaces the
/// current "in-progress" caption line.
#[derive(Debug, Clone, Serialize)]
pub struct SttPartial {
    pub text: String,
    pub language: Option<String>,
    pub source: SttSource,
}

/// Payload emitted to the frontend when a token batch is finalized — the
/// frontend should append this to the running transcript and clear partial.
#[derive(Debug, Clone, Serialize)]
pub struct SttFinal {
    pub text: String,
    pub language: Option<String>,
    pub source: SttSource,
}

/// Payload emitted on a session error so the overlay can surface it instead
/// of a stale caption. `code` carries `reconnecting` / `aborted` for the
/// reconnect state machine; specific error codes for fatal cases.
#[derive(Debug, Clone, Serialize)]
pub struct SttError {
    pub code: Option<String>,
    pub message: String,
    pub source: SttSource,
}

#[derive(Deserialize, Debug)]
struct Token {
    text: String,
    #[serde(default)]
    is_final: bool,
    #[serde(default)]
    language: Option<String>,
}

#[derive(Deserialize, Debug)]
struct ServerMessage {
    #[serde(default)]
    tokens: Vec<Token>,
    #[serde(default)]
    finished: bool,
    /// Spec is unstable on this — accept either string or integer.
    #[serde(default)]
    error_code: Option<serde_json::Value>,
    #[serde(default)]
    error_message: Option<String>,
}

/// Run one websocket session. Returns when the stream ends (cleanly or with
/// a drop). Caller is responsible for reconnect / backoff decisions.
///
/// Pre-replay: all chunks currently in `ring` are sent as binary frames
/// before consuming new chunks from `chunk_rx`. This lets a reconnect resume
/// without losing the last ~30s of speech.
///
/// `final_tx` is an optional sink the translator pipeline subscribes to —
/// each finalized English text is forwarded into it before the `stt_final`
/// emit, so a downstream Solar Pro 3 worker can translate it.
pub async fn run_session(
    api_key: &str,
    app: &AppHandle,
    chunk_rx: &mut UnboundedReceiver<Vec<u8>>,
    stop: &Arc<AtomicBool>,
    final_tx: Option<tokio::sync::mpsc::UnboundedSender<String>>,
    ring: &Arc<Mutex<AudioRing>>,
    source: SttSource,
) -> Result<SessionEnd> {
    let (ws, _resp) = connect_async(SONIOX_WS_URL)
        .await
        .context("Soniox WebSocket connect failed")?;
    let (mut sink, mut stream) = ws.split();

    let config = json!({
        "api_key": api_key,
        "model": "stt-rt-v4",
        "audio_format": "pcm_s16le",
        "sample_rate": TARGET_SAMPLE_RATE,
        "num_channels": 1,
        "language_hints": ["en", "ko"],
        "enable_endpoint_detection": true,
        "enable_language_identification": true,
    });
    sink.send(Message::Text(config.to_string())).await?;
    println!("[stt] connected to Soniox stt-rt-v4");

    // Ring replay — drain whatever the bridge has already buffered. On the
    // first session this is whatever audio arrived before the websocket was
    // ready (rare, near-empty); on reconnect it's up to ~30s of speech we'd
    // otherwise lose to the gap.
    {
        let snapshot = ring.lock().expect("ring mutex poisoned").snapshot();
        if !snapshot.is_empty() {
            let total_bytes: usize = snapshot.iter().map(|c| c.len()).sum();
            println!(
                "[stt] replaying {} chunks / {} bytes from ring",
                snapshot.len(),
                total_bytes
            );
            for chunk in snapshot {
                if let Err(e) = sink.send(Message::Binary(chunk)).await {
                    return Ok(SessionEnd::Dropped(format!("ring replay send: {e}")));
                }
            }
        }
    }

    let aborted = Arc::new(AtomicBool::new(false));
    let finished = Arc::new(AtomicBool::new(false));
    let drop_reason: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));

    // Reader task — server messages → Tauri events.
    //
    // Soniox sends the *current* partial state on every message (each new
    // word arrives as a delta on top of the previous partial slate). Our
    // partial state is therefore PER-MESSAGE: we rebuild it fresh each time
    // and let the frontend replace its display. Final tokens, in contrast,
    // are commit-once-and-append: each message's finals are new content the
    // frontend should add to its running transcript.
    let app_for_reader = app.clone();
    let aborted_reader = aborted.clone();
    let finished_reader = finished.clone();
    let drop_reason_reader = drop_reason.clone();
    let final_tx_for_reader = final_tx.clone();
    let reader = tokio::spawn(async move {
        let mut last_partial_was_empty = true;

        while let Some(msg) = stream.next().await {
            match msg {
                Ok(Message::Text(t)) => match serde_json::from_str::<ServerMessage>(&t) {
                    Ok(m) => {
                        if let Some(err) = m.error_message {
                            let code = m.error_code.map(|v| v.to_string());
                            let _ = app_for_reader.emit(
                                "stt_error",
                                SttError {
                                    code,
                                    message: err.clone(),
                                    source,
                                },
                            );
                            *drop_reason_reader.lock().unwrap() =
                                Some(format!("server error: {err}"));
                            aborted_reader.store(true, Ordering::SeqCst);
                            return;
                        }
                        let mut final_text = String::new();
                        let mut final_lang: Option<String> = None;
                        let mut partial_text = String::new();
                        let mut partial_lang: Option<String> = None;
                        for tok in m.tokens {
                            // `<end>` is Soniox's endpoint marker (boundary,
                            // not transcript content). Skip.
                            if tok.text.trim() == "<end>" {
                                continue;
                            }
                            if tok.is_final {
                                final_text.push_str(&tok.text);
                                if final_lang.is_none() {
                                    final_lang = tok.language.clone();
                                }
                            } else {
                                partial_text.push_str(&tok.text);
                                if partial_lang.is_none() {
                                    partial_lang = tok.language.clone();
                                }
                            }
                        }
                        if !final_text.is_empty() {
                            // Forward to translator before consuming the
                            // text in the emit. English finals only — Korean
                            // finals are already in the user's language and
                            // need no translation; let the frontend show
                            // them as-is.
                            if let Some(tx) = &final_tx_for_reader {
                                let is_english = final_lang
                                    .as_deref()
                                    .map(|l| l.starts_with("en"))
                                    .unwrap_or(true);
                                if is_english {
                                    let _ = tx.send(final_text.clone());
                                }
                            }
                            let _ = app_for_reader.emit(
                                "stt_final",
                                SttFinal {
                                    text: final_text,
                                    language: final_lang,
                                    source,
                                },
                            );
                        }
                        // Emit partial whenever it's non-empty, AND once when
                        // it transitions to empty so the frontend clears any
                        // leftover partial after finals committed.
                        let partial_is_empty = partial_text.is_empty();
                        if !partial_is_empty || !last_partial_was_empty {
                            if !partial_is_empty {
                                println!(
                                    "[stt partial] chars={} preview={:?}",
                                    partial_text.chars().count(),
                                    partial_text.chars().take(40).collect::<String>()
                                );
                            }
                            let _ = app_for_reader.emit(
                                "stt_partial",
                                SttPartial {
                                    text: partial_text,
                                    language: partial_lang,
                                    source,
                                },
                            );
                        }
                        last_partial_was_empty = partial_is_empty;
                        if m.finished {
                            finished_reader.store(true, Ordering::SeqCst);
                            aborted_reader.store(true, Ordering::SeqCst);
                            return;
                        }
                    }
                    Err(e) => eprintln!("[stt] parse err: {e}; raw: {t}"),
                },
                Ok(Message::Close(_)) => {
                    *drop_reason_reader.lock().unwrap() = Some("server closed websocket".into());
                    aborted_reader.store(true, Ordering::SeqCst);
                    return;
                }
                Ok(_) => {}
                Err(e) => {
                    *drop_reason_reader.lock().unwrap() = Some(format!("ws recv: {e}"));
                    aborted_reader.store(true, Ordering::SeqCst);
                    return;
                }
            }
        }
        // Stream ended without explicit close/error. Treat as drop.
        if !finished_reader.load(Ordering::SeqCst) {
            *drop_reason_reader.lock().unwrap() = Some("stream ended".into());
            aborted_reader.store(true, Ordering::SeqCst);
        }
    });

    // Writer loop — chunk_rx → ws binary frames. Owns sink to keep this task
    // single-writer.
    while let Some(bytes) = chunk_rx.recv().await {
        if aborted.load(Ordering::SeqCst) || stop.load(Ordering::SeqCst) {
            break;
        }
        if let Err(e) = sink.send(Message::Binary(bytes)).await {
            *drop_reason.lock().unwrap() = Some(format!("ws send: {e}"));
            break;
        }
    }
    // Soniox EOS = empty text frame, then explicit close. Wrap the entire
    // teardown in a single timeout so that *any* await in here — the EOS
    // send, the sink.close handshake, or reader.next() pending on the
    // server's Close frame — can't deadlock stop_capture. Five seconds is
    // generous enough for a clean shutdown but short enough that the user
    // sees the SessionDetail snap into place. The reader task is then
    // abandoned (process-exit cleans it up).
    let _ = tokio::time::timeout(std::time::Duration::from_secs(5), async {
        let _ = sink.send(Message::Text(String::new())).await;
        let _ = sink.close().await;
        let _ = reader.await;
    })
    .await;

    if stop.load(Ordering::SeqCst) {
        println!("[stt] session ended (stop)");
        return Ok(SessionEnd::Stopped);
    }
    if finished.load(Ordering::SeqCst) {
        println!("[stt] session ended (finished)");
        return Ok(SessionEnd::Finished);
    }
    if let Some(reason) = drop_reason.lock().unwrap().take() {
        println!("[stt] session ended (dropped: {reason})");
        return Ok(SessionEnd::Dropped(reason));
    }
    // chunk_rx closed without error and no abort signal — capture stopped
    // naturally (sender dropped on capture-thread teardown).
    println!("[stt] session ended (chunk channel closed)");
    Ok(SessionEnd::Stopped)
}

/// Probe a Soniox API key by opening a WebSocket session, sending the same
/// config we'd use for transcription, and waiting briefly for a response.
///
/// Soniox sends an `error_message` frame (with `error_code` like
/// `"INVALID_API_KEY"`) before closing when auth fails. A valid key stays
/// silent until audio arrives, so a short timeout with no rejection is
/// treated as success.
///
/// No audio is sent. Connection is closed after the verdict.
pub async fn verify_key(api_key: &str) -> Result<(), String> {
    let (ws, _) = connect_async(SONIOX_WS_URL)
        .await
        .map_err(|e| format!("Connect failed: {e}"))?;
    let (mut sink, mut stream) = ws.split();

    let config = json!({
        "api_key": api_key,
        "model": "stt-rt-v4",
        "audio_format": "pcm_s16le",
        "sample_rate": TARGET_SAMPLE_RATE,
        "num_channels": 1,
    });
    sink.send(Message::Text(config.to_string()))
        .await
        .map_err(|e| format!("Send config failed: {e}"))?;

    let verdict = tokio::time::timeout(std::time::Duration::from_millis(1_500), async {
        while let Some(msg) = stream.next().await {
            match msg {
                Ok(Message::Text(t)) => {
                    if let Ok(parsed) = serde_json::from_str::<ServerMessage>(&t) {
                        if let Some(err) = parsed.error_message {
                            return Err(err);
                        }
                        // Any non-error message means handshake succeeded.
                        return Ok(());
                    }
                }
                Ok(Message::Close(frame)) => {
                    let reason = frame
                        .map(|f| f.reason.to_string())
                        .unwrap_or_else(|| "server closed".into());
                    return Err(reason);
                }
                Err(e) => return Err(format!("recv: {e}")),
                _ => {}
            }
        }
        Err("stream ended without verdict".into())
    })
    .await;

    let _ = sink.send(Message::Text(String::new())).await;

    match verdict {
        // No rejection within 1.5s → server accepted the key.
        Err(_) => Ok(()),
        Ok(Ok(())) => Ok(()),
        Ok(Err(msg)) => Err(msg),
    }
}
