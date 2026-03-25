import assert from "node:assert/strict";
import test from "node:test";
import {
  createRunMarketAutomationAction,
  createRunProviderSyncAction
} from "@/lib/action-factories/admin-automation";

test("createRunProviderSyncAction blocks non-admin sessions", async () => {
  const action = createRunProviderSyncAction({
    auth: async () => null,
    getApiKey: () => "api-key",
    syncCricketDataMatches: async () => {
      throw new Error("should not be called");
    },
    revalidatePath() {},
    revalidateTag() {},
    logActionStart() {},
    logActionSuccess() {},
    logActionError() {}
  });

  const result = await action({});

  assert.deepEqual(result, { error: "Admin authorization required." });
});

test("createRunProviderSyncAction returns a success message for admins", async () => {
  const revalidatedPaths: string[] = [];
  const revalidatedTags: string[] = [];

  const action = createRunProviderSyncAction({
    auth: async () => ({
      user: {
        id: "admin-1",
        email: "admin@stakeipl.app",
        role: "ADMIN"
      }
    }),
    getApiKey: () => "api-key",
    syncCricketDataMatches: async () => ({
      syncedMatchCount: 25,
      createdMatchCount: 0,
      updatedMatchCount: 25,
      prunedMatchCount: 3
    }),
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

  const result = await action({});

  assert.deepEqual(result, {
    success: "Synced 25 provider match(es) and pruned 3 stale match(es)."
  });
  assert.deepEqual(revalidatedPaths, ["/", "/admin"]);
  assert.deepEqual(revalidatedTags, ["homepage-data", "admin:overview"]);
});

test("createRunMarketAutomationAction blocks non-admin sessions", async () => {
  const action = createRunMarketAutomationAction({
    auth: async () => null,
    runMarketAutomation: async () => {
      throw new Error("should not be called");
    },
    revalidatePath() {},
    revalidateTag() {},
    logActionStart() {},
    logActionSuccess() {},
    logActionError() {}
  });

  const result = await action({});

  assert.deepEqual(result, { error: "Admin authorization required." });
});

test("createRunMarketAutomationAction revalidates affected market pages", async () => {
  const revalidatedPaths: string[] = [];
  const revalidatedTags: string[] = [];

  const action = createRunMarketAutomationAction({
    auth: async () => ({
      user: {
        id: "admin-1",
        email: "admin@stakeipl.app",
        role: "ADMIN"
      }
    }),
    runMarketAutomation: async () => ({
      createdMarketCount: 2,
      openedMarketCount: 1,
      closedMarketCount: 0,
      settledMarketCount: 1,
      createdMarketIds: ["market-1", "market-2"],
      openedMarketIds: ["market-1"],
      closedMarketIds: [],
      settledMarketIds: ["market-3"]
    }),
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

  const result = await action({});

  assert.deepEqual(result, {
    success: "Automation ran. Created 2, opened 1, closed 0, settled 1."
  });
  assert.deepEqual(revalidatedPaths, [
    "/",
    "/admin",
    "/dashboard",
    "/markets/market-1",
    "/markets/market-2",
    "/markets/market-3"
  ]);
  assert.deepEqual(revalidatedTags, [
    "homepage-data",
    "admin:overview",
    "market:market-1",
    "market:market-2",
    "market:market-3"
  ]);
});
