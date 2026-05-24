//! Upstage Solar Pro 3 non-streaming batch summarize call.
//!
//! Returns a structured `SummaryResult` JSON. System prompt uses Korean
//! framing so the model defaults to producing Korean themes/title — the
//! Bartleby audience is the Korean ear, the English audio is just the
//! input modality.

use serde::{Deserialize, Serialize};
use serde_json::json;

const UPSTAGE_URL: &str = "https://api.upstage.ai/v1/chat/completions";
const MODEL: &str = "solar-pro3";

const SYSTEM_PROMPT: &str = "You are Bartleby, a literary scrivener summarising a live meeting \
transcript. Output ONLY valid JSON matching this exact schema:\n\
{\"working_title\": string, \"themes\": [string], \"quote_candidate\": string | null}\n\n\
Rules:\n\
- working_title: 8 단어 이하의 짧은 편집자 제목 (Korean 우선, 영어도 허용).\n\
- themes: 3-5개의 한국어 thematic 문장. 작은 fact nuggets 보다는 회의에서 떠오른 주제·논점·합의·갈등.\n\
- quote_candidate: 회의에서 *그대로* 발화된 가장 인사이트 짙거나 감정적으로 울리는 한 줄 (60자 이내). 영어 발화면 영어 그대로 인용. 인용할 만한 게 없으면 null.\n\n\
회의가 너무 짧아서 요약 불가능하면 themes: [], quote_candidate: null 반환.";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryResult {
    pub working_title: String,
    pub themes: Vec<String>,
    pub quote_candidate: Option<String>,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[derive(Deserialize)]
struct ChatMessage {
    content: String,
}

/// Render the accumulated finalized texts as a transcript block for the
/// prompt. Blank entries are skipped; each kept line gets a stable index.
pub fn build_transcript(finals: &[String]) -> String {
    let mut out = String::new();
    let mut idx = 0usize;
    for line in finals {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        idx += 1;
        out.push_str(&format!("{:02}. ", idx));
        out.push_str(trimmed);
        out.push('\n');
    }
    out
}

/// Parse Solar Pro 3's response. The model is given `response_format: json_object`
/// so we expect bare JSON, but some Upstage routes still wrap it in ```json
/// fences — strip those defensively.
pub fn parse_response(raw: &str) -> Result<SummaryResult, String> {
    let trimmed = raw.trim();
    let body = if let Some(stripped) = trimmed.strip_prefix("```json") {
        stripped.trim_start().trim_end_matches("```").trim()
    } else if let Some(stripped) = trimmed.strip_prefix("```") {
        stripped.trim_start().trim_end_matches("```").trim()
    } else {
        trimmed
    };
    serde_json::from_str::<SummaryResult>(body).map_err(|e| {
        format!(
            "JSON parse: {e} | body={}",
            body.chars().take(200).collect::<String>()
        )
    })
}

pub async fn summarize(
    client: &reqwest::Client,
    api_key: &str,
    transcript: &str,
) -> Result<SummaryResult, String> {
    if transcript.trim().is_empty() {
        return Err("empty transcript".into());
    }
    let user_content = format!(
        "회의 진행 중 transcript 입니다. JSON 으로 요약해주세요.\n\nTranscript:\n{}\n\nJSON:",
        transcript
    );
    let body = json!({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "stream": false,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
    });

    let resp = client
        .post(UPSTAGE_URL)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("request failed: {e}"))?;

    let status = resp.status();
    if !status.is_success() {
        let body_text = resp.text().await.unwrap_or_default();
        return Err(format!(
            "status {status}: {}",
            body_text.chars().take(200).collect::<String>()
        ));
    }
    let parsed: ChatResponse = resp
        .json()
        .await
        .map_err(|e| format!("response decode: {e}"))?;
    let content = parsed
        .choices
        .into_iter()
        .next()
        .ok_or_else(|| "no choices in response".to_string())?
        .message
        .content;
    parse_response(&content)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_transcript_numbers_lines_skipping_blank() {
        let lines = vec![
            "Hello world.".to_string(),
            "  ".to_string(),
            "How are you?".to_string(),
            "".to_string(),
            "Three.".to_string(),
        ];
        let out = build_transcript(&lines);
        assert!(
            out.contains("01. Hello world."),
            "expected 01 line, got: {out}"
        );
        assert!(
            out.contains("02. How are you?"),
            "expected 02 line, got: {out}"
        );
        assert!(out.contains("03. Three."), "expected 03 line, got: {out}");
        // Blank lines don't get numbered or included
        assert!(!out.contains("  ."));
    }

    #[test]
    fn build_transcript_empty_input_empty_output() {
        let out = build_transcript(&[]);
        assert_eq!(out, "");
        let out2 = build_transcript(&["".to_string(), "   ".to_string()]);
        assert_eq!(out2, "");
    }

    #[test]
    fn parse_response_handles_bare_json() {
        let raw = r#"{"working_title":"Demo","themes":["a","b"],"quote_candidate":"yes"}"#;
        let parsed = parse_response(raw).expect("parses");
        assert_eq!(parsed.working_title, "Demo");
        assert_eq!(parsed.themes, vec!["a", "b"]);
        assert_eq!(parsed.quote_candidate, Some("yes".to_string()));
    }

    #[test]
    fn parse_response_strips_code_fences() {
        let raw = "```json\n{\"working_title\":\"X\",\"themes\":[],\"quote_candidate\":null}\n```";
        let parsed = parse_response(raw).expect("parses");
        assert_eq!(parsed.working_title, "X");
        assert!(parsed.themes.is_empty());
        assert_eq!(parsed.quote_candidate, None);
    }

    #[test]
    fn parse_response_handles_null_quote() {
        let raw = r#"{"working_title":"Title","themes":["one"],"quote_candidate":null}"#;
        let parsed = parse_response(raw).expect("parses");
        assert_eq!(parsed.quote_candidate, None);
    }

    #[test]
    fn parse_response_rejects_invalid_json() {
        let raw = "not json at all";
        assert!(parse_response(raw).is_err());
    }
}
