export const UPSTAGE_URL = "https://api.upstage.ai/v1/chat/completions";
export const MODEL = "solar-pro3";

const SUMMARY_SYSTEM_PROMPT = `You are Bartleby, a literary scrivener summarising a live meeting transcript. Output ONLY valid JSON matching this exact schema:
{"working_title": string, "themes": [string], "quote_candidate": string | null}

Rules:
- working_title: 8 단어 이하의 짧은 편집자 제목 (Korean 우선, 영어도 허용).
- themes: 3-5개의 한국어 thematic 문장. 작은 fact nuggets 보다는 회의에서 떠오른 주제·논점·합의·갈등.
- quote_candidate: 회의에서 *그대로* 발화된 가장 인사이트 짙거나 감정적으로 울리는 한 줄 (60자 이내). 영어 발화면 영어 그대로 인용. 인용할 만한 게 없으면 null.

회의가 너무 짧아서 요약 불가능하면 themes: [], quote_candidate: null 반환.`;

const TRANSLATE_SYSTEM_PROMPT = "You translate English speech to natural Korean. Output ONLY the Korean translation — no explanation, no quotes, no English, no romanization. Match the conversational register and tone of the source. Preserve technical terms when no clean Korean equivalent exists.";

export function buildTranscript(body) {
  if (typeof body?.transcript === "string") return body.transcript.trim();
  if (Array.isArray(body?.finals)) {
    return body.finals
      .map((line) => String(line || "").trim())
      .filter(Boolean)
      .map((line, index) => `${String(index + 1).padStart(2, "0")}. ${line}`)
      .join("\n");
  }
  return "";
}

export function buildSummaryRequest(transcript) {
  return {
    model: MODEL,
    messages: [
      { role: "system", content: SUMMARY_SYSTEM_PROMPT },
      {
        role: "user",
        content: `회의 진행 중 transcript 입니다. JSON 으로 요약해주세요.\n\nTranscript:\n${transcript}\n\nJSON:`,
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
    const err = new Error("empty transcript");
    err.status = 400;
    throw err;
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
