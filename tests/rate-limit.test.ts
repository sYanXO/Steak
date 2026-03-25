import assert from "node:assert/strict";
import test from "node:test";
import {
  consumeGroupJoinAttempt,
  consumeSignInAttempt,
  consumeSignUpAttempt,
  formatRetryMessage,
  resetAllRateLimits,
  resetSignInAttempts
} from "@/lib/rate-limit";

test("sign-up limiter blocks after three attempts per email", () => {
  resetAllRateLimits();

  assert.equal(consumeSignUpAttempt("captain@test.com").allowed, true);
  assert.equal(consumeSignUpAttempt("captain@test.com").allowed, true);
  assert.equal(consumeSignUpAttempt("captain@test.com").allowed, true);

  const blocked = consumeSignUpAttempt("captain@test.com");

  assert.equal(blocked.allowed, false);
  assert.match(formatRetryMessage("sign-up", blocked.retryAfterSeconds), /Too many sign-up attempts/);
});

test("sign-in limiter resets after a successful sign-in", () => {
  resetAllRateLimits();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(consumeSignInAttempt("captain@test.com").allowed, true);
  }

  assert.equal(consumeSignInAttempt("captain@test.com").allowed, false);

  resetSignInAttempts("captain@test.com");

  assert.equal(consumeSignInAttempt("captain@test.com").allowed, true);
});

test("group-join limiter is scoped by user and slug", () => {
  resetAllRateLimits();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    assert.equal(consumeGroupJoinAttempt("captain@test.com", "league-alpha").allowed, true);
  }

  assert.equal(consumeGroupJoinAttempt("captain@test.com", "league-alpha").allowed, false);
  assert.equal(consumeGroupJoinAttempt("captain@test.com", "league-beta").allowed, true);
  assert.equal(consumeGroupJoinAttempt("admin@test.com", "league-alpha").allowed, true);
});
