//! Single batch finalize call invoked when the user stops a recording.
//!
//! Unlike `summary::start` (the 30s live tick, removed in Phase 5 S1), this
//! runs once at end-of-meeting and produces a structured 4-field result:
//!
//!   - `tldr`     : 1-2 sentence narrative
//!   - `outline`  : chronological topic chunks, each with `ref_utterance_ids`
//!                  pointing back into the transcript for jump-to-source
//!   - `onepager` : markdown narrative with H2 sections
//!   - `quote`    : single most striking line verbatim, or null
//!
//! Bartleby voice rules baked into the prompt:
//!   - generic-heading blocklist (개요 / 회의 요약 / 참석자 / 결론 / 미팅 시작)
//!   - Korean -했음 / -였다 declarative style (never -했습니다)
//!   - no action-items / decisions / participants sections
//!   - quote in source language (English audio → English quote)

use serde::{Deserialize, Serialize};
use serde_json::json;

const UPSTAGE_URL: &str = "https://api.upstage.ai/v1/chat/completions";
const MODEL: &str = "solar-pro3";

const SYSTEM_PROMPT: &str = "You are Bartleby, a literary scrivener finalising a recorded note. \
The source may be a meeting, a lecture, a video, a podcast, or any spoken material — \
NEVER assume it's a meeting. Infer the format from the content itself; narrate \
the substance directly without naming the format.\n\n\
Output ONLY valid JSON matching this exact schema:\n\
{\n\
  \"tldr\": string,\n\
  \"outline\": [{\"topic_title\": string, \"bullets\": [string], \"ref_utterance_ids\": [int, int]}],\n\
  \"onepager\": string,\n\
  \"quote\": string | null\n\
}\n\n\
Voice & style:\n\
- Korean declarative style: -했음 / -였다 / -이다. **Never** use -했습니다 / -입니다 (사무관 voice).\n\
- Avoid generic / format-naming headings. Forbidden topic_title strings (Korean and English): \
개요, 회의 요약, 회의 진행, 참석자, 결론, 미팅 시작, 미팅 종료, 영상 요약, 강의 요약, \
podcast 요약, 본 영상, 본 회의, Overview, Summary, Introduction, Participants, Conclusion.\n\
- No action-items / decisions / participants sections anywhere. Bartleby does not enumerate tasks.\n\n\
Field rules:\n\
- tldr: 1-2 sentences narrating what the recording actually engaged with — the topic itself, not the format. \
**Do not start with format-naming phrases** like '이번 회의는', '이 영상은', '본 강의는', '이 podcast 는', '이번 미팅에서는'. \
Avoid cliché openers '이번', '본', '이 자료는'. Open with the topic, a verb, or the speaker's claim. \
Example tones: 'X와 Y의 차이를 논의하며 Z에 도달했다.' / '신경망 학습이 verifiable 영역에 편향된 이유를 설명한다.'\n\
- outline: 3-7 chronological topic chunks. Each chunk has:\n\
  - topic_title: short Korean phrase, topic-specific (avoid blocklist above; never name the source format).\n\
  - bullets: 2-5 declarative facts about that topic.\n\
  - ref_utterance_ids: [first_utterance_id, last_utterance_id] from the transcript that backs this chunk. Use the literal `id` field from the input transcript. If you genuinely cannot map the chunk to ids, return [0, 0] — the renderer disables the jump gracefully.\n\
- onepager: markdown. Begin with one overview paragraph (no heading; same no-format-naming rule). \
Then 2-4 `## H2` sections (specific titles, blocklist applies) with body paragraphs. \
Use blank lines between paragraphs. Same -했음 / -였다 style throughout.\n\
- quote: a single most-striking utterance from the transcript, verbatim, in the original language (English audio → English quote). ≤80 characters. null if nothing stands out.\n\n\
If the transcript is too short / sparse to produce a meaningful note, return:\n\
{\"tldr\": \"\", \"outline\": [], \"onepager\": \"\", \"quote\": null}";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutlineChunk {
    pub topic_title: String,
    #[serde(default)]
    pub bullets: Vec<String>,
    /// [first_id, last_id] inclusive. [0, 0] = LLM could not map.
    #[serde(default)]
    pub ref_utterance_ids: Vec<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinalizeResult {
    pub tldr: String,
    pub outline: Vec<OutlineChunk>,
    pub onepager: String,
    pub quote: Option<String>,
}

/// Shape of a single utterance row passed in from the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputUtterance {
    pub id: i64,
    pub time: String,
    pub speaker: String,
    #[serde(rename = "enText")]
    pub en_text: String,
    #[serde(rename = "koText")]
    pub ko_text: Option<String>,
}

#[derive(Serialize)]
struct HostedFinalizeRequest<'a> {
    transcript: &'a [InputUtterance],
}

/// Render the utterance list as a transcript block the model can scan and
/// reference by `id`. Empty rows skipped; ko translations included as a
/// secondary line so the model can pick a Korean quote if appropriate.
pub fn build_transcript_indexed(utterances: &[InputUtterance]) -> String {
    let mut out = String::new();
    for u in utterances {
        let trimmed = u.en_text.trim();
        if trimmed.is_empty() {
            continue;
        }
        out.push_str(&format!(
            "[id={} | {} | {}] {}\n",
            u.id, u.time, u.speaker, trimmed
        ));
        if let Some(ko) = &u.ko_text {
            let ko_trim = ko.trim();
            if !ko_trim.is_empty() {
                out.push_str(&format!("    └ {}\n", ko_trim));
            }
        }
    }
    out
}

/// Parse Solar Pro 3's response. JSON mode is requested so the body is
/// usually bare JSON, but some Upstage routes still wrap it in ```json fences.
pub fn parse_response(raw: &str) -> Result<FinalizeResult, String> {
    let trimmed = raw.trim();
    let body = if let Some(stripped) = trimmed.strip_prefix("```json") {
        stripped.trim_start().trim_end_matches("```").trim()
    } else if let Some(stripped) = trimmed.strip_prefix("```") {
        stripped.trim_start().trim_end_matches("```").trim()
    } else {
        trimmed
    };
    serde_json::from_str::<FinalizeResult>(body).map_err(|e| {
        format!(
            "finalize JSON parse: {e} | body={}",
            body.chars().take(200).collect::<String>()
        )
    })
}

/// One-shot finalize call. Returns `Ok(FinalizeResult)` on a clean response,
/// `Err(message)` on any failure (network / non-2xx / parse).
pub async fn finalize_session(
    client: &reqwest::Client,
    api_key: &str,
    utterances: &[InputUtterance],
) -> Result<FinalizeResult, String> {
    let transcript = build_transcript_indexed(utterances);
    if transcript.trim().is_empty() {
        return Ok(FinalizeResult {
            tldr: String::new(),
            outline: Vec::new(),
            onepager: String::new(),
            quote: None,
        });
    }

    let user_content = format!(
        "다음은 방금 종료된 녹취의 전체 transcript 입니다 (utterance id 포함). \
         source 가 회의/강의/영상/podcast 어느 것이든 가능 — 내용에서 추론하되 \
         포맷 이름을 직접 부르지 말 것. JSON schema 그대로 Bartleby voice 로 정리.\n\n\
         Transcript:\n{}\n\nJSON:",
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
        .map_err(|e| format!("finalize network: {e}"))?;

    let status = resp.status();
    let text = resp
        .text()
        .await
        .map_err(|e| format!("finalize read body: {e}"))?;
    if !status.is_success() {
        return Err(format!(
            "finalize HTTP {status}: {}",
            text.chars().take(300).collect::<String>()
        ));
    }

    let envelope: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("finalize envelope JSON: {e}"))?;
    let content = envelope
        .pointer("/choices/0/message/content")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "finalize: choices[0].message.content missing".to_string())?;

    parse_response(content)
}

/// Hosted-relay finalize call. The app sends only the transcript plus the
/// Bartleby relay token; the relay injects the server-side Upstage key and
/// applies the same Bartleby final-note schema.
pub async fn finalize_session_hosted(
    client: &reqwest::Client,
    relay_base_url: &str,
    token: &str,
    utterances: &[InputUtterance],
) -> Result<FinalizeResult, String> {
    let transcript = build_transcript_indexed(utterances);
    if transcript.trim().is_empty() {
        return Ok(FinalizeResult {
            tldr: String::new(),
            outline: Vec::new(),
            onepager: String::new(),
            quote: None,
        });
    }

    let url = format!(
        "{}/v1/summary/finalize",
        relay_base_url.trim_end_matches('/')
    );
    let resp = client
        .post(url)
        .bearer_auth(token)
        .json(&HostedFinalizeRequest {
            transcript: utterances,
        })
        .send()
        .await
        .map_err(|e| format!("hosted finalize network: {e}"))?;

    let status = resp.status();
    let text = resp
        .text()
        .await
        .map_err(|e| format!("hosted finalize read body: {e}"))?;
    if !status.is_success() {
        return Err(format!(
            "hosted finalize HTTP {status}: {}",
            text.chars().take(300).collect::<String>()
        ));
    }

    serde_json::from_str::<FinalizeResult>(&text).map_err(|e| {
        format!(
            "hosted finalize JSON parse: {e} | body={}",
            text.chars().take(200).collect::<String>()
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn u(id: i64, time: &str, speaker: &str, en: &str, ko: Option<&str>) -> InputUtterance {
        InputUtterance {
            id,
            time: time.to_string(),
            speaker: speaker.to_string(),
            en_text: en.to_string(),
            ko_text: ko.map(|s| s.to_string()),
        }
    }

    #[test]
    fn transcript_indexed_skips_empty_en() {
        let rows = vec![
            u(1, "00:00:01", "system", "First line.", None),
            u(2, "00:00:05", "system", "   ", None),
            u(3, "00:00:09", "user", "Third line.", Some("세 번째.")),
        ];
        let out = build_transcript_indexed(&rows);
        assert!(out.contains("[id=1 | 00:00:01 | system] First line."));
        assert!(!out.contains("id=2"));
        assert!(out.contains("[id=3 | 00:00:09 | user] Third line."));
        assert!(out.contains("└ 세 번째."));
    }

    #[test]
    fn parse_bare_json() {
        let raw = r#"{
            "tldr": "이번 회의는 X를 다뤘음.",
            "outline": [
                {"topic_title": "주제 A", "bullets": ["a1", "a2"], "ref_utterance_ids": [1, 5]}
            ],
            "onepager": "회의는 X에 관한 것이었다.\n\n## 주제 A\n\nA에 대해 논의했음.",
            "quote": "We should ship."
        }"#;
        let res = parse_response(raw).expect("should parse");
        assert_eq!(res.outline.len(), 1);
        assert_eq!(res.outline[0].ref_utterance_ids, vec![1, 5]);
        assert_eq!(res.quote.as_deref(), Some("We should ship."));
    }

    #[test]
    fn parse_fenced_json() {
        let raw = "```json\n{\"tldr\":\"a\",\"outline\":[],\"onepager\":\"\",\"quote\":null}\n```";
        let res = parse_response(raw).expect("fenced should parse");
        assert_eq!(res.tldr, "a");
        assert!(res.outline.is_empty());
        assert!(res.quote.is_none());
    }

    #[test]
    fn parse_malformed_returns_err() {
        let raw = "not json at all";
        assert!(parse_response(raw).is_err());
    }

    #[test]
    fn parse_empty_quote_null() {
        let raw = r#"{"tldr":"","outline":[],"onepager":"","quote":null}"#;
        let res = parse_response(raw).unwrap();
        assert!(res.quote.is_none());
    }

    #[test]
    fn parse_outline_missing_optional_fields() {
        // bullets / ref_utterance_ids default to empty if absent
        let raw = r#"{
            "tldr":"x",
            "outline":[{"topic_title":"t"}],
            "onepager":"",
            "quote":null
        }"#;
        let res = parse_response(raw).unwrap();
        assert_eq!(res.outline.len(), 1);
        assert!(res.outline[0].bullets.is_empty());
        assert!(res.outline[0].ref_utterance_ids.is_empty());
    }

    /// Smoke: prompt contains the heading blocklist + voice rule terms.
    /// This catches accidental edits that water down the voice contract.
    #[test]
    fn system_prompt_contains_blocklist_and_voice_rules() {
        assert!(SYSTEM_PROMPT.contains("개요"));
        assert!(SYSTEM_PROMPT.contains("회의 요약"));
        assert!(SYSTEM_PROMPT.contains("참석자"));
        assert!(SYSTEM_PROMPT.contains("Overview"));
        assert!(SYSTEM_PROMPT.contains("-했음"));
        assert!(SYSTEM_PROMPT.contains("-했습니다"));
        assert!(SYSTEM_PROMPT.contains("action-items"));
    }
}
