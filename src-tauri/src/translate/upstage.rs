//! Upstage Solar Pro 3 EN → KO translation call (direct API, not OpenRouter).
//!
//! Streaming SSE POST: emits `translation_partial` per delta chunk so the
//! Korean caption types out token-by-token in the overlay (live caption feel),
//! then `translation_final` on `[DONE]`. Replaces Day 16a's wait-then-emit
//! pattern — same depth=1 sequential ordering, just with intermediate states.
//!
//! SSE shape (OpenAI-compatible):
//!   data: {"choices":[{"delta":{"content":"빠른"}}]}\n\n
//!   ...
//!   data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n
//!   data: [DONE]\n\n
//!
//! UTF-8 boundary safety: bytes_stream() chunks land mid-character (Korean is
//! 3 bytes/char). We accumulate into a byte buffer and only decode complete
//! `\n\n`-delimited events, so each parsed line is guaranteed to end on an
//! event boundary (the JSON itself can't split a UTF-8 codepoint).
//!
//! Direct Upstage API (api.upstage.ai/v1/chat/completions). $0.15/M in,
//! $0.60/M out, $0.015/M cached input — system prompt reuse means caching
//! kicks in after first call.

use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter};

const UPSTAGE_URL: &str = "https://api.upstage.ai/v1/chat/completions";
const MODEL: &str = "solar-pro3";

const SYSTEM_PROMPT: &str = "You translate English speech to natural Korean. \
Output ONLY the Korean translation — no explanation, no quotes, no English, \
no romanization. Match the conversational register and tone of the source. \
Preserve technical terms when no clean Korean equivalent exists.";

#[derive(Debug, Clone, Serialize)]
pub struct TranslationPartial {
    pub original: String,
    pub translation: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TranslationFinal {
    pub original: String,
    pub translation: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TranslationError {
    pub message: String,
    pub original: String,
}

#[derive(Deserialize)]
struct StreamChoice {
    delta: StreamDelta,
}

#[derive(Deserialize)]
struct StreamDelta {
    #[serde(default)]
    content: Option<String>,
}

#[derive(Deserialize)]
struct StreamChunk {
    choices: Vec<StreamChoice>,
}

pub async fn translate_and_emit(
    client: &reqwest::Client,
    api_key: &str,
    app: &AppHandle,
    en: String,
) {
    let trimmed = en.trim();
    if trimmed.is_empty() {
        return;
    }

    let body = json!({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": trimmed},
        ],
        "stream": true,
        "temperature": 0.3,
    });

    let resp = match client
        .post(UPSTAGE_URL)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let _ = app.emit(
                "translation_error",
                TranslationError {
                    message: format!("request failed: {e}"),
                    original: en,
                },
            );
            return;
        }
    };

    let status = resp.status();
    if !status.is_success() {
        let body_text = resp.text().await.unwrap_or_default();
        let _ = app.emit(
            "translation_error",
            TranslationError {
                message: format!("status {status}: {body_text}"),
                original: en,
            },
        );
        return;
    }

    let mut stream = resp.bytes_stream();
    let mut buf: Vec<u8> = Vec::with_capacity(2048);
    let mut accumulated = String::new();
    let mut got_done = false;

    while let Some(chunk) = stream.next().await {
        let bytes = match chunk {
            Ok(b) => b,
            Err(e) => {
                let _ = app.emit(
                    "translation_error",
                    TranslationError {
                        message: format!("stream chunk error: {e}"),
                        original: en.clone(),
                    },
                );
                return;
            }
        };
        buf.extend_from_slice(&bytes);

        // Drain complete events (\n\n-delimited). Each event is one or more
        // `data:` lines; we only care about single-line data per OpenAI spec.
        while let Some(boundary) = find_event_boundary(&buf) {
            let event_bytes: Vec<u8> = buf.drain(..boundary + 2).collect();
            // Strip trailing \n\n then split into lines.
            let event = String::from_utf8_lossy(&event_bytes[..event_bytes.len() - 2]);
            for line in event.lines() {
                let Some(payload) = line.strip_prefix("data:") else {
                    continue;
                };
                let payload = payload.trim();
                if payload.is_empty() {
                    continue;
                }
                if payload == "[DONE]" {
                    got_done = true;
                    continue;
                }
                let parsed: StreamChunk = match serde_json::from_str(payload) {
                    Ok(p) => p,
                    Err(e) => {
                        eprintln!("[translate] sse parse: {e} | payload={payload}");
                        continue;
                    }
                };
                let Some(delta) = parsed.choices.into_iter().next() else {
                    continue;
                };
                let Some(piece) = delta.delta.content else {
                    continue;
                };
                if piece.is_empty() {
                    continue;
                }
                accumulated.push_str(&piece);
                let _ = app.emit(
                    "translation_partial",
                    TranslationPartial {
                        original: en.clone(),
                        translation: accumulated.clone(),
                    },
                );
            }
        }
    }

    let final_ko = accumulated.trim().to_string();
    if !got_done && final_ko.is_empty() {
        let _ = app.emit(
            "translation_error",
            TranslationError {
                message: "stream ended without [DONE] or content".into(),
                original: en,
            },
        );
        return;
    }
    if final_ko.is_empty() {
        let _ = app.emit(
            "translation_error",
            TranslationError {
                message: "empty translation from model".into(),
                original: en,
            },
        );
        return;
    }
    let _ = app.emit(
        "translation_final",
        TranslationFinal {
            original: en,
            translation: final_ko,
        },
    );
}

/// Returns the index of the first byte of `\n\n` in `buf`, if present.
fn find_event_boundary(buf: &[u8]) -> Option<usize> {
    buf.windows(2).position(|w| w == b"\n\n")
}

/// Probe an Upstage API key with a minimal non-streaming completion. 200 →
/// accepted, 401 → rejected, anything else → surfaced as a generic error
/// so the user knows verification couldn't decide.
pub async fn verify_key(api_key: &str) -> Result<(), String> {
    let client = reqwest::Client::new();
    let body = json!({
        "model": MODEL,
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 1,
        "stream": false,
    });
    let resp = client
        .post(UPSTAGE_URL)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    let status = resp.status();
    if status.is_success() {
        return Ok(());
    }
    if status == reqwest::StatusCode::UNAUTHORIZED {
        return Err("Upstage rejected the key (401)".into());
    }
    let body_text = resp.text().await.unwrap_or_default();
    Err(format!("HTTP {}: {}", status, body_text.chars().take(200).collect::<String>()))
}
