import assert from "node:assert/strict";
import test from "node:test";
import { manualTopUp, updateMarketStatus } from "@/lib/services/admin-operations";
import { placeStake } from "@/lib/services/place-stake";
import { settleMarket } from "@/lib/services/settle-market";
import { mockPrismaTransaction } from "@/tests/helpers/prisma";

function assertLedgerEntryInvariant(entry: Record<string, unknown>, startingBalance: number) {
  const amountDelta = Number(entry.amountDelta);
  const balanceAfter = Number(entry.balanceAfter);

  assert.equal(
    balanceAfter,
    startingBalance + amountDelta,
    `Expected balanceAfter ${balanceAfter} to equal starting balance ${startingBalance} plus delta ${amountDelta}.`
  );
}

test("manualTopUp ledger entry balanceAfter matches credited wallet balance", async () => {
  const ledgerEntries: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      async findUnique({ where }: { where: { id?: string } }) {
        if (where.id === "admin-1") {
          return { id: "admin-1", role: "ADMIN" };
        }

        return {
          id: "user-1",
          name: "Captain",
          email: "captain@stakeipl.app",
          wallet: { id: "wallet-1", balance: 5000 }
        };
      }
    },
    wallet: {
      async update() {
        return {};
      },
      async findMany() {
        return [{ userId: "user-1", balance: 5075, createdAt: new Date("2026-01-01") }];
      }
    },
    ledgerEntry: {
      async create({ data }: { data: Record<string, unknown> }) {
        ledgerEntries.push(data);
        return { id: "ledger-1" };
      }
    },
    adminActionLog: {
      async create() {
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

  const result = await manualTopUp({
    adminId: "admin-1",
    userId: "user-1",
    amount: 75,
    reason: "Support correction"
  });

  assertLedgerEntryInvariant(ledgerEntries[0], 5000);
  assert.equal(Number(ledgerEntries[0]?.balanceAfter), result.balanceAfter);
});

test("placeStake ledger entry balanceAfter matches debited wallet balance", async () => {
  const ledgerEntries: Array<Record<string, unknown>> = [];

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
      async update() {
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
      async update() {
        return { marketId: "market-1", id: "outcome-a", currentOdds: 1.8, totalStaked: 12500 };
      }
    },
    outcomeOddsSnapshot: {
      async createMany() {
        return { count: 2 };
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

  assertLedgerEntryInvariant(ledgerEntries[0], 5000);
  assert.equal(Number(ledgerEntries[0]?.balanceAfter), result.balanceAfter);
});

test("settleMarket winner credit ledger entry matches payout and final balance", async () => {
  const ledgerEntries: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      async findUnique() {
        return { id: "admin-1", role: "ADMIN" };
      }
    },
    market: {
      async findUnique() {
        return {
          id: "market-1",
          title: "Match winner",
          status: "OPEN",
          outcomes: [
            { id: "outcome-a", label: "Mumbai" },
            { id: "outcome-b", label: "Chennai" }
          ],
          stakes: [
            {
              id: "stake-1",
              outcomeId: "outcome-a",
              payoutBasis: 182,
              user: {
                wallet: { id: "wallet-1", balance: 4900 }
              }
            }
          ]
        };
      },
      async update({ data }: { data: Record<string, unknown> }) {
        return { id: "market-1", ...data };
      }
    },
    stake: {
      async update() {
        return {};
      }
    },
    wallet: {
      async update() {
        return {};
      },
      async findMany() {
        return [{ userId: "user-1", balance: 5082, createdAt: new Date("2026-01-01") }];
      }
    },
    ledgerEntry: {
      async create({ data }: { data: Record<string, unknown> }) {
        ledgerEntries.push(data);
        return {};
      }
    },
    adminActionLog: {
      async create() {
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

  await settleMarket({
    marketId: "market-1",
    outcomeId: "outcome-a",
    adminId: "admin-1"
  });

  assertLedgerEntryInvariant(ledgerEntries[0], 4900);
  assert.equal(Number(ledgerEntries[0]?.amountDelta), 182);
  assert.equal(Number(ledgerEntries[0]?.balanceAfter), 5082);
});

test("void refund ledger entry restores the staked amount to wallet balance", async () => {
  const ledgerEntries: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      async findUnique({ where }: { where: { id?: string } }) {
        return { id: where.id, role: "ADMIN" };
      }
    },
    market: {
      async findUnique() {
        return {
          id: "market-1",
          title: "Match winner",
          status: "OPEN",
          closesAt: new Date(Date.now() + 60_000),
          settledAt: null,
          settledOutcomeId: null,
          match: { id: "match-1" }
        };
      },
      async update({ data }: { data: Record<string, unknown> }) {
        return { id: "market-1", status: data.status };
      }
    },
    stake: {
      async findMany() {
        return [
          {
            id: "stake-1",
            amount: 100,
            outcome: { label: "Mumbai" },
            user: { wallet: { id: "wallet-1", balance: 4900 } }
          }
        ];
      },
      async update() {
        return {};
      }
    },
    wallet: {
      async update() {
        return {};
      },
      async findMany() {
        return [{ userId: "user-1", balance: 5000, createdAt: new Date("2026-01-01") }];
      }
    },
    ledgerEntry: {
      async create({ data }: { data: Record<string, unknown> }) {
        ledgerEntries.push(data);
        return {};
      }
    },
    adminActionLog: {
      async create() {
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

  await updateMarketStatus({
    adminId: "admin-1",
    marketId: "market-1",
    status: "VOID"
  });

  assertLedgerEntryInvariant(ledgerEntries[0], 4900);
  assert.equal(Number(ledgerEntries[0]?.amountDelta), 100);
  assert.equal(Number(ledgerEntries[0]?.balanceAfter), 5000);
});
