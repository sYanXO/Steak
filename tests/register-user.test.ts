import assert from "node:assert/strict";
import test from "node:test";
import { registerUser, STARTER_BALANCE } from "@/lib/services/register-user";
import { mockPrismaTransaction } from "@/tests/helpers/prisma";

test("registerUser provisions wallet, starter ledger entry, and leaderboard rows", async () => {
  let createPayload: Record<string, unknown> | undefined;
  let leaderboardRows: Array<Record<string, unknown>> = [];

  const tx = {
    user: {
      async create({ data }: { data: Record<string, unknown> }) {
        createPayload = data;
        return { id: "user-1", email: "captain@test.com", name: "Captain" };
      }
    },
    wallet: {
      async findMany() {
        return [{ userId: "user-1", balance: STARTER_BALANCE, createdAt: new Date("2026-01-01") }];
      }
    },
    leaderboardEntry: {
      async deleteMany() {
        return { count: 0 };
      },
      async createMany({ data }: { data: Array<Record<string, unknown>> }) {
        leaderboardRows = data;
        return { count: data.length };
      }
    },
    group: {
      async findMany() {
        return [];
      }
    }
  };

  mockPrismaTransaction(tx);

  const user = await registerUser({
    name: "Captain",
    email: "Captain@Test.com",
    password: "strongpass123",
    confirmPassword: "strongpass123"
  });

  assert.equal(user.email, "captain@test.com");
  assert.ok(createPayload);
  assert.equal(createPayload?.email, "captain@test.com");
  assert.equal((createPayload?.wallet as { create: { balance: number } }).create.balance, STARTER_BALANCE);
  assert.match(String(createPayload?.passwordHash), /^\$2[aby]\$/);
  assert.deepEqual(leaderboardRows, [
    {
      scope: "GLOBAL",
      userId: "user-1",
      rank: 1,
      score: STARTER_BALANCE,
      balance: STARTER_BALANCE
    }
  ]);
});
