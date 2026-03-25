import assert from "node:assert/strict";
import test from "node:test";
import { createCronCricketdataSyncRoute } from "@/lib/route-factories/cron-cricketdata-sync";
import { createCronMarketAutomationRoute } from "@/lib/route-factories/cron-market-automation";

test("cron market automation route rejects unauthorized requests", async () => {
  const route = createCronMarketAutomationRoute({
    getSecret: () => "secret-123",
    runMarketAutomation: async () => {
      throw new Error("should not be called");
    },
    revalidatePath() {},
    revalidateTag() {},
    logActionStart() {},
    logActionSuccess() {},
    logActionError() {}
  });

  const response = await route(new Request("https://stake-ipl.app/api/cron/market-automation"));
  const body = (await response.json()) as { error: string };

  assert.equal(response.status, 401);
  assert.deepEqual(body, { error: "Unauthorized." });
});

test("cron cricketdata sync route runs sync only by default", async () => {
  let automationCalls = 0;
  const revalidatedPaths: string[] = [];
  const revalidatedTags: string[] = [];

  const route = createCronCricketdataSyncRoute({
    getSecret: () => "secret-123",
    getApiKey: () => "api-key",
    syncCricketDataMatches: async () => ({
      syncedMatchCount: 25,
      createdMatchCount: 1,
      updatedMatchCount: 24,
      prunedMatchCount: 2
    }),
    runMarketAutomation: async () => {
      automationCalls += 1;
      return {
        createdMarketCount: 2,
        openedMarketCount: 0,
        closedMarketCount: 0,
        settledMarketCount: 0,
        liveMatchCount: 0,
        completedMatchCount: 0,
        createdMarketIds: [],
        openedMarketIds: [],
        closedMarketIds: [],
        settledMarketIds: []
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

  const response = await route(
    new Request("https://stake-ipl.app/api/cron/cricketdata-sync", {
      headers: {
        authorization: "Bearer secret-123"
      }
    })
  );
  const body = (await response.json()) as {
    ok: boolean;
    syncSummary: { syncedMatchCount: number };
    automationSummary: null;
  };

  assert.equal(response.status, 200);
  assert.equal(automationCalls, 0);
  assert.equal(body.ok, true);
  assert.equal(body.syncSummary.syncedMatchCount, 25);
  assert.equal(body.automationSummary, null);
  assert.deepEqual(revalidatedPaths, ["/", "/admin"]);
  assert.deepEqual(revalidatedTags, ["homepage-data", "admin:overview"]);
});

test("cron cricketdata sync route can include automation explicitly", async () => {
  let automationCalls = 0;

  const route = createCronCricketdataSyncRoute({
    getSecret: () => "secret-123",
    getApiKey: () => "api-key",
    syncCricketDataMatches: async () => ({
      syncedMatchCount: 10,
      createdMatchCount: 0,
      updatedMatchCount: 10,
      prunedMatchCount: 1
    }),
    runMarketAutomation: async () => {
      automationCalls += 1;
      return {
        createdMarketCount: 2,
        openedMarketCount: 1,
        closedMarketCount: 0,
        settledMarketCount: 0,
        liveMatchCount: 1,
        completedMatchCount: 0,
        createdMarketIds: ["market-1", "market-2"],
        openedMarketIds: ["market-1"],
        closedMarketIds: [],
        settledMarketIds: []
      };
    },
    revalidatePath() {},
    revalidateTag() {},
    logActionStart() {},
    logActionSuccess() {},
    logActionError() {}
  });

  const response = await route(
    new Request("https://stake-ipl.app/api/cron/cricketdata-sync?automation=1", {
      headers: {
        authorization: "Bearer secret-123"
      }
    })
  );
  const body = (await response.json()) as {
    automationSummary: { createdMarketCount: number };
  };

  assert.equal(response.status, 200);
  assert.equal(automationCalls, 1);
  assert.equal(body.automationSummary.createdMarketCount, 2);
});

test("cron market automation route revalidates affected market pages", async () => {
  const revalidatedPaths: string[] = [];
  const revalidatedTags: string[] = [];

  const route = createCronMarketAutomationRoute({
    getSecret: () => "secret-123",
    runMarketAutomation: async () => ({
      createdMarketCount: 1,
      openedMarketCount: 1,
      closedMarketCount: 0,
      settledMarketCount: 1,
      liveMatchCount: 0,
      completedMatchCount: 1,
      createdMarketIds: ["market-1"],
      openedMarketIds: ["market-1"],
      closedMarketIds: [],
      settledMarketIds: ["market-2"]
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

  const response = await route(
    new Request("https://stake-ipl.app/api/cron/market-automation", {
      headers: {
        authorization: "Bearer secret-123"
      }
    })
  );
  const body = (await response.json()) as { ok: boolean };

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.deepEqual(revalidatedPaths, [
    "/",
    "/admin",
    "/dashboard",
    "/markets/market-1",
    "/markets/market-2"
  ]);
  assert.deepEqual(revalidatedTags, [
    "homepage-data",
    "admin:overview",
    "market:market-1",
    "market:market-2"
  ]);
});
