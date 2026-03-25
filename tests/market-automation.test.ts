import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { runMarketAutomation } from "@/lib/services/market-automation";

test("runMarketAutomation creates default toss and match winner markets for scheduled matches", async () => {
  const originalUserFindMany = prisma.user.findMany;
  const originalMatchFindMany = prisma.match.findMany;
  const originalMarketCreate = prisma.market.create;
  const originalAdminActionCreate = prisma.adminActionLog.create;
  const originalSnapshotCreateMany = prisma.outcomeOddsSnapshot.createMany;
  const originalMatchUpdateMany = prisma.match.updateMany;
  const originalMarketFindMany = prisma.market.findMany;
  const originalMarketUpdateMany = prisma.market.updateMany;

  const createdMarkets: Array<Record<string, unknown>> = [];

  prisma.user.findMany = ((async () => [{ id: "admin-1" }]) as unknown) as typeof prisma.user.findMany;
  prisma.match.findMany = ((async () => [
    {
      id: "match-1",
      title: "Mumbai Indians vs Chennai Super Kings",
      homeTeam: "Mumbai Indians",
      awayTeam: "Chennai Super Kings",
      provider: "CRICKETDATA",
      providerMatchId: "provider-1",
      startsAt: new Date("2026-04-01T14:00:00.000Z"),
      status: "SCHEDULED",
      tossWinner: null,
      tossDecision: null,
      winnerTeam: null,
      completedAt: null,
      lastSyncedAt: null,
      createdAt: new Date("2026-03-30T00:00:00.000Z"),
      updatedAt: new Date("2026-03-30T00:00:00.000Z"),
      markets: []
    }
  ]) as unknown) as typeof prisma.match.findMany;
  prisma.market.create = ((async ({ data }: Record<string, unknown>) => {
    createdMarkets.push(data as Record<string, unknown>);
    const outcomes = (data as { outcomes?: { create: Array<{ label: string }> } }).outcomes?.create ?? [];

    return {
      id: `market-${createdMarkets.length}`,
      title: (data as { title: string }).title,
      outcomes: outcomes.map((outcome, index) => ({
        id: `outcome-${createdMarkets.length}-${index + 1}`,
        label: outcome.label,
        currentOdds: 2,
        totalStaked: 0
      }))
    } as never;
  }) as unknown) as typeof prisma.market.create;
  prisma.adminActionLog.create = ((async () => ({})) as unknown) as typeof prisma.adminActionLog.create;
  prisma.outcomeOddsSnapshot.createMany = ((async () => ({ count: 2 })) as unknown) as typeof prisma.outcomeOddsSnapshot.createMany;
  prisma.match.updateMany = ((async () => ({ count: 0 })) as unknown) as typeof prisma.match.updateMany;
  prisma.market.findMany = ((async () => []) as unknown) as typeof prisma.market.findMany;
  prisma.market.updateMany = ((async () => ({ count: 0 })) as unknown) as typeof prisma.market.updateMany;

  try {
    const summary = await runMarketAutomation(new Date("2026-03-31T14:00:00.000Z"));

    assert.equal(summary.createdMarketCount, 2);
    assert.equal(createdMarkets.length, 2);
    assert.deepEqual(
      createdMarkets.map((market) => (market as { automationKey?: string }).automationKey),
      ["MATCH_WINNER", "TOSS_WINNER"]
    );
  } finally {
    prisma.user.findMany = originalUserFindMany;
    prisma.match.findMany = originalMatchFindMany;
    prisma.market.create = originalMarketCreate;
    prisma.adminActionLog.create = originalAdminActionCreate;
    prisma.outcomeOddsSnapshot.createMany = originalSnapshotCreateMany;
    prisma.match.updateMany = originalMatchUpdateMany;
    prisma.market.findMany = originalMarketFindMany;
    prisma.market.updateMany = originalMarketUpdateMany;
  }
});

test("runMarketAutomation auto-settles eligible automated markets from match results", async () => {
  const originalUserFindMany = prisma.user.findMany;
  const originalMatchFindMany = prisma.match.findMany;
  const originalMatchUpdateMany = prisma.match.updateMany;
  const originalMarketFindMany = prisma.market.findMany;
  const originalMarketUpdateMany = prisma.market.updateMany;

  const settled: Array<Record<string, unknown>> = [];

  prisma.user.findMany = ((async () => [{ id: "admin-1" }]) as unknown) as typeof prisma.user.findMany;
  prisma.match.findMany = ((async () => []) as unknown) as typeof prisma.match.findMany;
  prisma.match.updateMany = ((async () => ({ count: 0 })) as unknown) as typeof prisma.match.updateMany;
  prisma.market.updateMany = ((async () => ({ count: 0 })) as unknown) as typeof prisma.market.updateMany;
  prisma.market.findMany = ((async () => [
    {
      id: "market-1",
      status: "CLOSED",
      title: "Match winner",
      type: "MATCH_WINNER",
      matchId: "match-1",
      opensAt: new Date("2026-04-01T10:00:00.000Z"),
      closesAt: new Date("2026-04-01T14:00:00.000Z"),
      settledAt: null,
      settledOutcomeId: null,
      automationEnabled: true,
      autoCreated: true,
      automationKey: "MATCH_WINNER",
      pricingMetadata: null,
      createdAt: new Date("2026-04-01T09:00:00.000Z"),
      updatedAt: new Date("2026-04-01T09:00:00.000Z"),
      match: {
        tossWinner: null,
        winnerTeam: "Mumbai Indians"
      },
      outcomes: [
        { id: "outcome-a", label: "Mumbai Indians" },
        { id: "outcome-b", label: "Chennai Super Kings" }
      ]
    }
  ]) as unknown) as typeof prisma.market.findMany;

  try {
    const summary = await runMarketAutomation(new Date("2026-04-01T15:00:00.000Z"), {
      prisma,
      settleMarketAutomatically: async (input) => {
        settled.push(input as Record<string, unknown>);
        return {
          marketId: input.marketId,
          settledOutcome: "Mumbai Indians",
          settledStakeCount: 0
        };
      }
    });

    assert.equal(summary.settledMarketCount, 1);
    assert.deepEqual(settled[0], {
      marketId: "market-1",
      outcomeId: "outcome-a",
      actorId: "admin-1"
    });
  } finally {
    prisma.user.findMany = originalUserFindMany;
    prisma.match.findMany = originalMatchFindMany;
    prisma.match.updateMany = originalMatchUpdateMany;
    prisma.market.findMany = originalMarketFindMany;
    prisma.market.updateMany = originalMarketUpdateMany;
  }
});
