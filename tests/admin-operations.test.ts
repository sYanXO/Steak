import assert from "node:assert/strict";
import test from "node:test";
import { manualTopUp, updateMarketStatus, updateMatch } from "@/lib/services/admin-operations";
import { mockPrismaTransaction } from "@/tests/helpers/prisma";

test("manualTopUp credits wallet and records ledger plus admin log", async () => {
  const ledgerEntries: Array<Record<string, unknown>> = [];
  const adminLogs: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      async findUnique({ where }: { where: { email?: string; id?: string } }) {
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
          settledAt: null,
          settledOutcomeId: null,
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

test("updateMarketStatus voids pending stakes and refunds wallets", async () => {
  const walletUpdates: Array<Record<string, unknown>> = [];
  const ledgerEntries: Array<Record<string, unknown>> = [];
  const stakeUpdates: Array<Record<string, unknown>> = [];
  const adminLogs: Array<Record<string, unknown>> = [];

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
      async update({ data }: { data: Record<string, unknown> }) {
        stakeUpdates.push(data);
        return {};
      }
    },
    wallet: {
      async update({ data }: { data: Record<string, unknown> }) {
        walletUpdates.push(data);
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

  const result = await updateMarketStatus({
    adminId: "admin-1",
    marketId: "market-1",
    status: "VOID"
  });

  assert.equal(result.status, "VOID");
  assert.deepEqual(walletUpdates[0], { balance: 5000 });
  assert.equal(ledgerEntries[0]?.type, "SETTLEMENT_REVERSAL");
  assert.equal(stakeUpdates[0]?.result, "VOID");
  assert.equal((adminLogs[0]?.metadata as { refundedStakeCount?: number }).refundedStakeCount, 1);
});

test("updateMatch edits the fixture and records an audit log", async () => {
  const adminLogs: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      async findUnique() {
        return { id: "admin-1", role: "ADMIN" };
      }
    },
    match: {
      async findUnique() {
        return {
          id: "match-1",
          title: "Old title",
          homeTeam: "Mumbai Indians",
          awayTeam: "Chennai Super Kings",
          startsAt: new Date("2026-03-30T12:30:00.000Z"),
          status: "SCHEDULED",
          markets: [{ id: "market-1", title: "Match winner", closesAt: new Date("2026-03-30T12:00:00.000Z") }]
        };
      },
      async update({ data }: { data: Record<string, unknown> }) {
        return {
          id: "match-1",
          title: data.title,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          startsAt: data.startsAt,
          status: data.status
        };
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

  const result = await updateMatch({
    adminId: "admin-1",
    matchId: "match-1",
    title: "Mumbai Indians vs Chennai Super Kings",
    homeTeam: "MI",
    awayTeam: "CSK",
    startsAt: "2026-03-30T13:00:00.000Z",
    status: "LIVE"
  });

  assert.equal(result.status, "LIVE");
  assert.equal(result.homeTeam, "MI");
  assert.equal(adminLogs[0]?.actionType, "MATCH_UPDATED");
});
