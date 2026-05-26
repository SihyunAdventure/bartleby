import test from "node:test";
import assert from "node:assert/strict";
import { createAuthenticator, parseTokenList, tokenFromRequest } from "../src/auth.js";

function req(headers) {
  return { headers };
}

test("parseTokenList accepts comma and newline separated tokens", () => {
  assert.deepEqual(parseTokenList(" a, b\n c ,,"), ["a", "b", "c"]);
});

test("tokenFromRequest prefers bearer auth", () => {
  assert.equal(tokenFromRequest(req({ authorization: "Bearer secret", "x-bartleby-token": "other" })), "secret");
});

test("authenticator rejects missing configuration", () => {
  const auth = createAuthenticator([]);
  assert.deepEqual(auth(req({})), { ok: false, status: 503, message: "relay auth is not configured" });
});

test("authenticator accepts configured token", () => {
  const auth = createAuthenticator(["abc"]);
  assert.deepEqual(auth(req({ authorization: "Bearer abc" })), { ok: true });
  assert.equal(auth(req({ authorization: "Bearer wrong" })).status, 401);
});
