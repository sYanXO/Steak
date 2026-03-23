import assert from "node:assert/strict";
import test from "node:test";
import { settleMarket } from "@/lib/services/settle-market";
import { mockPrismaTransaction } from "@/tests/helpers/prisma";

test("settleMarket resolves pending stakes, credits winners, and writes audit data", async () => {
  const walletUpdates: Array<Record<string, unknown>> = [];
  const ledgerEntries: Array<Record<string, unknown>> = [];
  const adminLogs: Array<Record<string, unknown>> = [];

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
      async update({ data }: { data: Record<string, unknown> }) {
        walletUpdates.push(data);
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
      async create({ data }: { data: Record<string, unknown> }) {
        adminLogs.push(data);
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

  const result = await settleMarket({
    marketId: "market-1",
    outcomeId: "outcome-a",
    adminEmail: "admin@stakeipl.app"
  });

  assert.equal(result.settledOutcome, "Mumbai");
  assert.deepEqual(walletUpdates[0], { balance: 5082 });
  assert.equal(ledgerEntries[0]?.type, "SETTLEMENT_CREDIT");
  assert.equal(adminLogs[0]?.actionType, "MARKET_SETTLED");
});
