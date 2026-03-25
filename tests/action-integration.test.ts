import assert from "node:assert/strict";
import test from "node:test";
import { createSettleMarketAction } from "@/app/admin/actions";
import { createPlaceStakeAction } from "@/app/markets/[marketId]/actions";
import { createSignUpAction } from "@/app/sign-up/actions";

test("createPlaceStakeAction returns auth error when no session is present", async () => {
  const action = createPlaceStakeAction({
    auth: async () => null,
    placeStake: async () => {
      throw new Error("should not be called");
    },
    revalidatePath() {},
    revalidateTag() {},
    logActionStart() {},
    logActionSuccess() {},
    logActionError() {}
  });

  const formData = new FormData();
  formData.set("outcomeId", "outcome-a");
  formData.set("amount", "100");

  const result = await action("market-1", {}, formData);

  assert.deepEqual(result, { error: "Sign in before placing a stake." });
});

test("createPlaceStakeAction returns success and revalidates cache for authenticated users", async () => {
  const revalidatedPaths: string[] = [];
  const revalidatedTags: string[] = [];
  const placeStakeCalls: Array<Record<string, unknown>> = [];

  const action = createPlaceStakeAction({
    auth: async () => ({
      user: {
        id: "user-1",
        email: "captain@stakeipl.app"
      }
    }),
    placeStake: async (input) => {
      placeStakeCalls.push(input as Record<string, unknown>);
      return {
        stakeId: "stake-1",
        quotedOdds: 1.82,
        payoutBasis: 182,
        balanceAfter: 4900
      };
    },
    revalidatePath(path) {
      revalidatedPaths.push(path);
    },
    revalidateTag(tag) {
      revalidatedTags.push(tag);
    },
    logActionStart() {},
    logActionSuccess() {},
    logActionError() {}
  });

  const formData = new FormData();
  formData.set("outcomeId", "outcome-a");
  formData.set("amount", "100");

  const result = await action("market-1", {}, formData);

  assert.deepEqual(placeStakeCalls[0], {
    marketId: "market-1",
    outcomeId: "outcome-a",
    amount: 100,
    userEmail: "captain@stakeipl.app"
  });
  assert.deepEqual(result, { success: "Stake placed at 1.82x odds." });
  assert.deepEqual(revalidatedPaths, ["/", "/dashboard", "/markets/market-1"]);
  assert.deepEqual(revalidatedTags, [
    "homepage-data",
    "market:market-1",
    "dashboard:user-1"
  ]);
});

test("createSettleMarketAction blocks non-admin sessions", async () => {
  const action = createSettleMarketAction({
    auth: async () => ({
      user: {
        id: "user-1",
        email: "captain@stakeipl.app",
        role: "USER"
      }
    }),
    settleMarket: async () => {
      throw new Error("should not be called");
    },
    revalidatePath() {},
    revalidateTag() {},
    runIdempotent: async (_key, run) => run(),
    logActionStart() {},
    logActionSuccess() {},
    logActionError() {}
  });

  const formData = new FormData();
  formData.set("requestId", "550e8400-e29b-41d4-a716-446655440000");
  formData.set("outcomeId", "outcome-a");

  const result = await action("market-1", {}, formData);

  assert.deepEqual(result, { error: "Admin authorization required." });
});

test("createSignUpAction returns validation-safe service errors without redirecting", async () => {
  let redirectedTo: string | null = null;

  const action = createSignUpAction({
    consumeSignUpAttempt: () => ({
      allowed: true,
      remaining: 2,
      retryAfterSeconds: 0
    }),
    formatRetryMessage: (actionName, seconds) => `${actionName}:${seconds}`,
    registerUser: async () => {
      throw new Error("An account already exists for that email.");
    },
    logActionStart() {},
    logActionSuccess() {},
    logActionError() {},
    redirect: ((path: string) => {
      redirectedTo = path;
      throw new Error("redirect should not be called");
    }) as typeof import("next/navigation").redirect
  });

  const formData = new FormData();
  formData.set("name", "Captain");
  formData.set("email", "captain@test.com");
  formData.set("password", "strongpass123");
  formData.set("confirmPassword", "strongpass123");

  const result = await action({}, formData);

  assert.deepEqual(result, { error: "An account already exists for that email." });
  assert.equal(redirectedTo, null);
});
