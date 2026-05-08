//! Soniox real-time STT WebSocket client (v4 model).
//!
//! Drives a single transcription session: opens the websocket, sends initial
//! config, forwards 120ms s16le chunks coming in over a tokio mpsc, and
//! emits `stt_partial` / `stt_final` / `stt_error` Tauri events as tokens
//! arrive. Mirrors the `drm_status` emit pattern.

use anyhow::{Context, Result};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc::UnboundedReceiver;
use tokio_tungstenite::{connect_async, tungstenite::Message};

const SONIOX_WS_URL: &str = "wss://stt-rt.soniox.com/transcribe-websocket";
const TARGET_SAMPLE_RATE: u32 = 16_000;

/// Payload emitted to the frontend on a partial token batch — replaces the
/// current "in-progress" caption line.
#[derive(Debug, Clone, Serialize)]
pub struct SttPartial {
    pub text: String,
    pub language: Option<String>,
}

/// Payload emitted to the frontend when a token batch is finalized — the
/// frontend should append this to the running transcript and clear partial.
#[derive(Debug, Clone, Serialize)]
pub struct SttFinal {
    pub text: String,
    pub language: Option<String>,
}

/// Payload emitted on a session error so the overlay can surface it instead
/// of a stale caption.
#[derive(Debug, Clone, Serialize)]
pub struct SttError {
    pub code: Option<String>,
    pub message: String,
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

/// Run the websocket session until `stop` flips, the chunk channel closes, or
/// the server reports `finished`/error. Intended to be `block_on`'d from a
/// dedicated thread that owns its tokio runtime.
pub async fn run_session(
    api_key: String,
    app: AppHandle,
    mut chunk_rx: UnboundedReceiver<Vec<u8>>,
    stop: Arc<AtomicBool>,
) -> Result<()> {
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
    println!("[stt] Connected to Soniox stt-rt-v4");

    let aborted = Arc::new(AtomicBool::new(false));

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
    let reader = tokio::spawn(async move {
        let mut last_partial_was_empty = true;

        while let Some(msg) = stream.next().await {
            match msg {
                Ok(Message::Text(t)) => match serde_json::from_str::<ServerMessage>(&t) {
                    Ok(m) => {
                        if let Some(err) = m.error_message {
                            let code = m.error_code.map(|v| v.to_string());
                            let _ = app_for_reader
                                .emit("stt_error", SttError { code, message: err });
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
                            let _ = app_for_reader.emit(
                                "stt_final",
                                SttFinal {
                                    text: final_text,
                                    language: final_lang,
                                },
                            );
                        }
                        // Emit partial whenever it's non-empty, AND once when
                        // it transitions to empty so the frontend clears any
                        // leftover partial after finals committed.
                        let partial_is_empty = partial_text.is_empty();
                        if !partial_is_empty || !last_partial_was_empty {
                            let _ = app_for_reader.emit(
                                "stt_partial",
                                SttPartial {
                                    text: partial_text,
                                    language: partial_lang,
                                },
                            );
                        }
                        last_partial_was_empty = partial_is_empty;
                        if m.finished {
                            return;
                        }
                    }
                    Err(e) => eprintln!("[stt] parse err: {e}; raw: {t}"),
                },
                Ok(Message::Close(_)) => {
                    aborted_reader.store(true, Ordering::SeqCst);
                    return;
                }
                Ok(_) => {}
                Err(e) => {
                    let _ = app_for_reader.emit(
                        "stt_error",
                        SttError {
                            code: None,
                            message: format!("ws recv: {e}"),
                        },
                    );
                    aborted_reader.store(true, Ordering::SeqCst);
                    return;
                }
            }
        }
    });

    // Writer loop — chunk_rx → ws binary frames. Owns sink to keep this task
    // single-writer.
    while let Some(bytes) = chunk_rx.recv().await {
        if aborted.load(Ordering::SeqCst) || stop.load(Ordering::SeqCst) {
            break;
        }
        if let Err(e) = sink.send(Message::Binary(bytes)).await {
            eprintln!("[stt] send err: {e}");
            break;
        }
    }
    // Soniox EOS = empty text frame. Best-effort; ignore errors after stop.
    let _ = sink.send(Message::Text(String::new())).await;
    let _ = reader.await;
    println!("[stt] session ended");
    Ok(())
}
