export const UPSTAGE_URL = "https://api.upstage.ai/v1/chat/completions";
export const MODEL = "solar-pro3";

const FINALIZE_SYSTEM_PROMPT = `You are Bartleby, a literary scrivener finalising a recorded note. The source may be a meeting, a lecture, a video, a podcast, or any spoken material — NEVER assume it's a meeting. Infer the format from the content itself; narrate the substance directly without naming the format.

Output ONLY valid JSON matching this exact schema:
{
  "tldr": string,
  "outline": [{"topic_title": string, "bullets": [string], "ref_utterance_ids": [int, int]}],
  "onepager": string,
  "quote": string | null
}

Voice & style:
- Korean declarative style: -했음 / -였다 / -이다. **Never** use -했습니다 / -입니다 (사무관 voice).
- Avoid generic / format-naming headings. Forbidden topic_title strings (Korean and English): 개요, 회의 요약, 회의 진행, 참석자, 결론, 미팅 시작, 미팅 종료, 영상 요약, 강의 요약, podcast 요약, 본 영상, 본 회의, Overview, Summary, Introduction, Participants, Conclusion.
- No action-items / decisions / participants sections anywhere. Bartleby does not enumerate tasks.

Field rules:
- tldr: 1-2 sentences narrating what the recording actually engaged with — the topic itself, not the format. **Do not start with format-naming phrases** like '이번 회의는', '이 영상은', '본 강의는', '이 podcast 는', '이번 미팅에서는'. Avoid cliché openers '이번', '본', '이 자료는'. Open with the topic, a verb, or the speaker's claim. Example tones: 'X와 Y의 차이를 논의하며 Z에 도달했다.' / '신경망 학습이 verifiable 영역에 편향된 이유를 설명한다.'
- outline: 3-7 chronological topic chunks. Each chunk has:
  - topic_title: short Korean phrase, topic-specific (avoid blocklist above; never name the source format).
  - bullets: 2-5 declarative facts about that topic.
  - ref_utterance_ids: [first_utterance_id, last_utterance_id] from the transcript that backs this chunk. Use the literal id field from the input transcript. If you genuinely cannot map the chunk to ids, return [0, 0] — the renderer disables the jump gracefully.
- onepager: markdown. Begin with one overview paragraph (no heading; same no-format-naming rule). Then 2-4 ## H2 sections (specific titles, blocklist applies) with body paragraphs. Use blank lines between paragraphs. Same -했음 / -였다 style throughout.
- quote: a single most-striking utterance from the transcript, verbatim, in the original language (English audio → English quote). ≤80 characters. null if nothing stands out.

If the transcript is too short / sparse to produce a meaningful note, return:
{"tldr": "", "outline": [], "onepager": "", "quote": null}`;

const TRANSLATE_SYSTEM_PROMPT = "You translate English speech to natural Korean. Output ONLY the Korean translation — no explanation, no quotes, no English, no romanization. Match the conversational register and tone of the source. Preserve technical terms when no clean Korean equivalent exists.";

export const EMPTY_FINALIZE_RESULT = {
  tldr: "",
  outline: [],
  onepager: "",
  quote: null,
};

function cleanString(value) {
  return String(value || "").trim();
}

function numberedLines(lines) {
  return lines
    .map((line) => cleanString(line))
    .filter(Boolean)
    .map((line, index) => `${String(index + 1).padStart(2, "0")}. ${line}`)
    .join("\n");
}

export function buildTranscript(body) {
  if (typeof body?.transcript === "string") return body.transcript.trim();

  if (Array.isArray(body?.transcript)) {
    const rows = [];
    for (const item of body.transcript) {
      const en = cleanString(item?.enText ?? item?.en_text ?? item?.text);
      if (!en) continue;
      const id = Number.isFinite(Number(item?.id)) ? Number(item.id) : rows.length + 1;
      const time = cleanString(item?.time) || "00:00:00";
      const speaker = cleanString(item?.speaker) || "system";
      rows.push(`[id=${id} | ${time} | ${speaker}] ${en}`);
      const ko = cleanString(item?.koText ?? item?.ko_text);
      if (ko) rows.push(`    └ ${ko}`);
    }
    return rows.join("\n");
  }

  if (Array.isArray(body?.finals)) {
    return numberedLines(body.finals);
  }
  return "";
}

export function buildSummaryRequest(transcript) {
  return {
    model: MODEL,
    messages: [
      { role: "system", content: FINALIZE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `다음은 방금 종료된 녹취의 전체 transcript 입니다 (utterance id 포함). source 가 회의/강의/영상/podcast 어느 것이든 가능 — 내용에서 추론하되 포맷 이름을 직접 부르지 말 것. JSON schema 그대로 Bartleby voice 로 정리.\n\nTranscript:\n${transcript}\n\nJSON:`,
      },
    ],
    stream: false,
    temperature: 0.3,
    response_format: { type: "json_object" },
  };
}

export function buildTranslateRequest(text, stream = false) {
  return {
    model: MODEL,
    messages: [
      { role: "system", content: TRANSLATE_SYSTEM_PROMPT },
      { role: "user", content: text.trim() },
    ],
    stream,
    temperature: 0.3,
  };
}

export function parseSummaryContent(raw) {
  const trimmed = String(raw || "").trim();
  const body = trimmed.startsWith("```json")
    ? trimmed.slice(7).trim().replace(/```$/, "").trim()
    : trimmed.startsWith("```")
      ? trimmed.slice(3).trim().replace(/```$/, "").trim()
      : trimmed;
  return JSON.parse(body);
}

async function callUpstage(apiKey, body) {
  if (!apiKey) {
    const err = new Error("UPSTAGE_API_KEY is not configured");
    err.status = 503;
    throw err;
  }
  const resp = await fetch(UPSTAGE_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return resp;
}

export async function summarize(apiKey, requestBody) {
  const transcript = buildTranscript(requestBody);
  if (!transcript) {
    return EMPTY_FINALIZE_RESULT;
  }
  const resp = await callUpstage(apiKey, buildSummaryRequest(transcript));
  if (!resp.ok) {
    const err = new Error(`Upstage summary failed: ${resp.status}`);
    err.status = resp.status;
    err.detail = (await resp.text()).slice(0, 500);
    throw err;
  }
  const parsed = await resp.json();
  const content = parsed?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("Upstage summary returned no content");
    err.status = 502;
    throw err;
  }
  return parseSummaryContent(content);
}

export async function translate(apiKey, requestBody) {
  const text = String(requestBody?.text || "").trim();
  if (!text) {
    const err = new Error("empty text");
    err.status = 400;
    throw err;
  }
  const resp = await callUpstage(apiKey, buildTranslateRequest(text, false));
  if (!resp.ok) {
    const err = new Error(`Upstage translation failed: ${resp.status}`);
    err.status = resp.status;
    err.detail = (await resp.text()).slice(0, 500);
    throw err;
  }
  const parsed = await resp.json();
  const translation = parsed?.choices?.[0]?.message?.content?.trim();
  if (!translation) {
    const err = new Error("Upstage translation returned no content");
    err.status = 502;
    throw err;
  }
  return { translation };
}

export async function streamTranslation(apiKey, requestBody, res) {
  const text = String(requestBody?.text || "").trim();
  if (!text) {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "empty text" }));
    return;
  }
  const upstream = await callUpstage(apiKey, buildTranslateRequest(text, true));
  if (!upstream.ok) {
    res.writeHead(upstream.status, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "upstage_translation_failed" }));
    return;
  }
  res.writeHead(200, {
    "content-type": upstream.headers.get("content-type") || "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
  });
  for await (const chunk of upstream.body) {
    res.write(Buffer.from(chunk));
  }
  res.end();
}
