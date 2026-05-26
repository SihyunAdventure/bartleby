import test from "node:test";
import assert from "node:assert/strict";
import { buildSonioxConfig, isJsonConfigMessage, messageByteLength, safeCloseCode } from "../src/soniox.js";

test("buildSonioxConfig pins public model surface and overwrites client key", () => {
  const cfg = buildSonioxConfig({ api_key: "client", model: "other", sample_rate: 48000, custom: true }, "server");
  assert.equal(cfg.api_key, "server");
  assert.equal(cfg.model, "stt-rt-v4");
  assert.equal(cfg.sample_rate, 16000);
  assert.equal(cfg.num_channels, 1);
  assert.deepEqual(cfg.language_hints, ["en", "ko"]);
  assert.equal(cfg.custom, true);
});

test("buildSonioxConfig requires server key", () => {
  assert.throws(() => buildSonioxConfig({}, ""), /SONIOX_API_KEY/);
});

test("isJsonConfigMessage distinguishes config from binary and EOS text", () => {
  assert.equal(isJsonConfigMessage(Buffer.from('{"model":"x"}'), false), true);
  assert.equal(isJsonConfigMessage(Buffer.from(""), false), false);
  assert.equal(isJsonConfigMessage(Buffer.from('{"model":"x"}'), true), false);
});


test("safeCloseCode rewrites reserved websocket close codes", () => {
  assert.equal(safeCloseCode(1000), 1000);
  assert.equal(safeCloseCode(1006), 1011);
  assert.equal(safeCloseCode(999), 1011);
});

test("messageByteLength handles buffers and buffer arrays", () => {
  assert.equal(messageByteLength(Buffer.from("abc")), 3);
  assert.equal(messageByteLength([Buffer.from("ab"), Buffer.from("c")]), 3);
});
