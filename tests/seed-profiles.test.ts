import assert from "node:assert/strict";
import test from "node:test";
import { getDemoSeedConfig, resolveSeedProfile } from "@/prisma/seed-profiles";

test("resolveSeedProfile defaults by database safety context", () => {
  assert.equal(
    resolveSeedProfile(undefined, "postgresql://user:pass@localhost:5432/app"),
    "local-demo"
  );
  assert.equal(
    resolveSeedProfile("", "postgresql://user:pass@ep-prod.neon.tech/db"),
    "production-safe"
  );
});

test("resolveSeedProfile accepts the supported profiles", () => {
  assert.equal(resolveSeedProfile("local-demo"), "local-demo");
  assert.equal(resolveSeedProfile("staging-demo"), "staging-demo");
  assert.equal(resolveSeedProfile("production-safe"), "production-safe");
});

test("resolveSeedProfile rejects unsupported profiles", () => {
  assert.throws(
    () => resolveSeedProfile("production"),
    /Invalid SEED_PROFILE/
  );
});

test("getDemoSeedConfig returns distinct local and staging ids", () => {
  const local = getDemoSeedConfig("local-demo");
  const staging = getDemoSeedConfig("staging-demo");

  assert.notEqual(local.admin.email, staging.admin.email);
  assert.notEqual(local.user.email, staging.user.email);
  assert.notEqual(local.match.id, staging.match.id);
  assert.notEqual(local.market.id, staging.market.id);
});
