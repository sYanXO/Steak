import assert from "node:assert/strict";
import test from "node:test";
import { placeStake } from "@/lib/services/place-stake";
import { mockPrismaTransaction } from "@/tests/helpers/prisma";

test("placeStake debits wallet, records ledger entry, and reprices outcomes", async () => {
  const walletUpdates: Array<Record<string, unknown>> = [];
  const ledgerEntries: Array<Record<string, unknown>> = [];
  const marketOutcomeUpdates: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      async findUnique() {
        return {
          id: "user-1",
          email: "captain@stakeipl.app",
          wallet: { id: "wallet-1", balance: 5000 }
        };
      }
    },
    stake: {
      async findFirst() {
        return null;
      },
      async create() {
        return { id: "stake-1" };
      }
    },
    market: {
      async findUnique() {
        return {
          id: "market-1",
          title: "Match winner",
          status: "OPEN",
          opensAt: new Date(Date.now() - 60_000),
          closesAt: new Date(Date.now() + 60_000),
          match: { startsAt: new Date(Date.now() + 120_000) },
          outcomes: [
            { id: "outcome-a", label: "Mumbai", currentOdds: 1.82, totalStaked: 12400 },
            { id: "outcome-b", label: "Chennai", currentOdds: 2.17, totalStaked: 10100 }
          ]
        };
      }
    },
    wallet: {
      async update({ data }: { data: Record<string, unknown> }) {
        walletUpdates.push(data);
        return {};
      },
      async findMany() {
        return [{ userId: "user-1", balance: 4900, createdAt: new Date("2026-01-01") }];
      }
    },
    ledgerEntry: {
      async create({ data }: { data: Record<string, unknown> }) {
        ledgerEntries.push(data);
        return {};
      }
    },
    marketOutcome: {
      async update({ data }: { data: Record<string, unknown> }) {
        marketOutcomeUpdates.push(data);
        return {};
      }
    },
    leaderboardEntry: {
      async deleteMany() {
        return { count: 0 };
      },
      async createMany() {
        return { count: 1 };
      }
    },
    group: {
      async findMany() {
        return [];
      }
    }
  };

  mockPrismaTransaction(tx);

  const result = await placeStake({
    marketId: "market-1",
    outcomeId: "outcome-a",
    amount: 100,
    userEmail: "captain@stakeipl.app"
  });

  assert.equal(result.quotedOdds, 1.82);
  assert.equal(result.balanceAfter, 4900);
  assert.deepEqual(walletUpdates[0], { balance: 4900 });
  assert.equal(ledgerEntries[0]?.type, "STAKE_DEBIT");
  assert.equal(ledgerEntries[0]?.amountDelta, -100);
  assert.equal(marketOutcomeUpdates.length, 2);
});

test("placeStake rejects insufficient balance", async () => {
  const tx = {
    user: {
      async findUnique() {
        return {
          id: "user-1",
          email: "captain@stakeipl.app",
          wallet: { id: "wallet-1", balance: 50 }
        };
      }
    },
    stake: {
      async findFirst() {
        return null;
      }
    },
    market: {
      async findUnique() {
        return {
          id: "market-1",
          title: "Match winner",
          status: "OPEN",
          opensAt: new Date(Date.now() - 60_000),
          closesAt: new Date(Date.now() + 60_000),
          match: { startsAt: new Date(Date.now() + 120_000) },
          outcomes: [{ id: "outcome-a", label: "Mumbai", currentOdds: 1.82, totalStaked: 12400 }]
        };
      }
    }
  };

  mockPrismaTransaction(tx);

  await assert.rejects(
    () =>
      placeStake({
        marketId: "market-1",
        outcomeId: "outcome-a",
        amount: 100,
        userEmail: "captain@stakeipl.app"
      }),
    /Insufficient balance/
  );
});

test("placeStake rejects a second stake in the same market", async () => {
  const tx = {
    user: {
      async findUnique() {
        return {
          id: "user-1",
          email: "captain@stakeipl.app",
          wallet: { id: "wallet-1", balance: 5000 }
        };
      }
    },
    stake: {
      async findFirst() {
        return {
          id: "stake-1",
          amount: 100,
          outcome: { label: "Mumbai" }
        };
      }
    }
  };

  mockPrismaTransaction(tx);

  await assert.rejects(
    () =>
      placeStake({
        marketId: "market-1",
        outcomeId: "outcome-b",
        amount: 50,
        userEmail: "captain@stakeipl.app"
      }),
    /already placed a stake/
  );
});
