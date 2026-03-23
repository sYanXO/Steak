import assert from "node:assert/strict";
import test from "node:test";
import { manualTopUp, updateMarketStatus } from "@/lib/services/admin-operations";
import { mockPrismaTransaction } from "@/tests/helpers/prisma";

test("manualTopUp credits wallet and records ledger plus admin log", async () => {
  const ledgerEntries: Array<Record<string, unknown>> = [];
  const adminLogs: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      async findUnique({ where }: { where: { email?: string; id?: string } }) {
        if (where.email) {
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

  const result = await manualTopUp({
    adminId: "admin-1",
    userId: "user-1",
    amount: 75,
    reason: "Support correction"
  });

  assert.equal(result.balanceAfter, 5075);
  assert.equal(ledgerEntries[0]?.type, "ADMIN_TOP_UP");
  assert.equal(adminLogs[0]?.actionType, "BALANCE_TOP_UP");
});

test("updateMarketStatus changes status and records an audit log", async () => {
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
          status: "DRAFT",
          closesAt: new Date(Date.now() + 60_000),
          match: { id: "match-1" }
        };
      },
      async update({ data }: { data: Record<string, unknown> }) {
        return { id: "market-1", status: data.status };
      }
    },
    adminActionLog: {
      async create({ data }: { data: Record<string, unknown> }) {
        adminLogs.push(data);
        return {};
      }
    }
  };

  mockPrismaTransaction(tx);

  const result = await updateMarketStatus({
    adminId: "admin-1",
    marketId: "market-1",
    status: "OPEN"
  });

  assert.equal(result.status, "OPEN");
  assert.equal(adminLogs[0]?.actionType, "MARKET_STATUS_CHANGED");
});
