import test from "node:test";
import assert from "node:assert/strict";
import { buildSummaryRequest, buildTranscript, buildTranslateRequest, parseSummaryContent } from "../src/upstage.js";

test("buildTranscript accepts transcript string", () => {
  assert.equal(buildTranscript({ transcript: " hello " }), "hello");
});

test("buildTranscript numbers finals and skips blanks", () => {
  assert.equal(buildTranscript({ finals: ["One", " ", "Two"] }), "01. One\n02. Two");
});

test("buildSummaryRequest asks for JSON object with Solar Pro 3", () => {
  const req = buildSummaryRequest("01. hello");
  assert.equal(req.model, "solar-pro3");
  assert.equal(req.stream, false);
  assert.deepEqual(req.response_format, { type: "json_object" });
});

test("buildTranslateRequest supports streaming flag", () => {
  const req = buildTranslateRequest("hello", true);
  assert.equal(req.model, "solar-pro3");
  assert.equal(req.stream, true);
});

test("parseSummaryContent accepts fenced JSON", () => {
  assert.deepEqual(parseSummaryContent('```json\n{"working_title":"x","themes":[],"quote_candidate":null}\n```'), {
    working_title: "x",
    themes: [],
    quote_candidate: null,
  });
});
