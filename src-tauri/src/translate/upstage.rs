//! Upstage Solar Pro 3 EN → KO translation call (direct API, not OpenRouter).
//!
//! Single non-streaming POST; emits a `translation_final` Tauri event on
//! success, `translation_error` on any HTTP/parse failure. Day 16a uses
//! sequential calls (one in-flight at a time) — Day 16b will add streaming
//! + concurrent depth-8 queue with seq ordering (PLAN.md L329-389 spec).
//!
//! Direct Upstage API (api.upstage.ai/v1/chat/completions) instead of
//! OpenRouter routing — OpenRouter's pooled Upstage account exhausted credits
//! 2026-05-08, indefinite outage. BYOK with Upstage key bypasses that.
//! Pricing identical ($0.15/M in, $0.60/M out, $0.015/M cached input — system
//! prompt is reused so caching kicks in after first call).

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
struct Choice {
    message: ChatMessage,
}

#[derive(Deserialize)]
struct ChatMessage {
    content: Option<String>,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
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
        "stream": false,
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

    match resp.json::<ChatResponse>().await {
        Ok(parsed) => {
            let ko = parsed
                .choices
                .into_iter()
                .next()
                .and_then(|c| c.message.content)
                .unwrap_or_default()
                .trim()
                .to_string();
            if ko.is_empty() {
                let _ = app.emit(
                    "translation_error",
                    TranslationError {
                        message: "empty response from model".into(),
                        original: en,
                    },
                );
                return;
            }
            let _ = app.emit(
                "translation_final",
                TranslationFinal {
                    original: en,
                    translation: ko,
                },
            );
        }
        Err(e) => {
            let _ = app.emit(
                "translation_error",
                TranslationError {
                    message: format!("response parse: {e}"),
                    original: en,
                },
            );
        }
    }
}
