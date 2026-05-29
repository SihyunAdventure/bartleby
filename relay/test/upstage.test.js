import test from "node:test";
import assert from "node:assert/strict";
import { buildSummaryRequest, buildTranscript, parseSummaryContent } from "../src/upstage.js";

test("buildTranscript accepts transcript string", () => {
  assert.equal(buildTranscript({ transcript: " hello " }), "hello");
});

test("buildTranscript renders indexed app transcript rows", () => {
  assert.equal(
    buildTranscript({
      transcript: [
        { id: 7, time: "00:00:01", speaker: "system", enText: "Hello.", koText: "안녕." },
        { id: 8, time: "00:00:04", speaker: "mic", enText: "   " },
      ],
    }),
    "[id=7 | 00:00:01 | system] Hello.\n    └ 안녕.",
  );
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

test("parseSummaryContent accepts fenced finalize JSON", () => {
  assert.deepEqual(parseSummaryContent('```json\n{"tldr":"x","outline":[],"onepager":"","quote":null}\n```'), {
    tldr: "x",
    outline: [],
    onepager: "",
    quote: null,
  });
});
