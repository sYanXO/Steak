import assert from "node:assert/strict";
import test from "node:test";
import { resetIdempotencyCache, runIdempotent } from "@/lib/idempotency";

test("runIdempotent only executes a matching operation once", async () => {
  resetIdempotencyCache();

  let executions = 0;

  const [first, second] = await Promise.all([
    runIdempotent("top-up:admin:request-1", async () => {
      executions += 1;
      return { ok: true };
    }),
    runIdempotent("top-up:admin:request-1", async () => {
      executions += 1;
      return { ok: true };
    })
  ]);

  assert.equal(executions, 1);
  assert.deepEqual(first, { ok: true });
  assert.deepEqual(second, { ok: true });
});

test("runIdempotent clears failed operations so a retry can run again", async () => {
  resetIdempotencyCache();

  let executions = 0;

  await assert.rejects(() =>
    runIdempotent("settle:admin:request-2", async () => {
      executions += 1;
      throw new Error("boom");
    })
  );

  const result = await runIdempotent("settle:admin:request-2", async () => {
    executions += 1;
    return "ok";
  });

  assert.equal(executions, 2);
  assert.equal(result, "ok");
});
