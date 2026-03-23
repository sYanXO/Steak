import assert from "node:assert/strict";
import test from "node:test";
import { createGroup, joinGroup } from "@/lib/services/groups";
import { mockPrismaTransaction } from "@/tests/helpers/prisma";

test("createGroup creates owner membership and initial group leaderboard", async () => {
  let createdGroupPayload: Record<string, unknown> | undefined;
  let groupLeaderboardRows: Array<Record<string, unknown>> = [];

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
    group: {
      async create({ data }: { data: Record<string, unknown> }) {
        createdGroupPayload = data;
        return { id: "group-1", name: "Night Watch", slug: "night-watch" };
      }
    },
    wallet: {
      async findMany() {
        return [{ userId: "user-1", balance: 5000, createdAt: new Date("2026-01-01") }];
      }
    },
    leaderboardEntry: {
      async deleteMany() {
        return { count: 0 };
      },
      async createMany({ data }: { data: Array<Record<string, unknown>> }) {
        groupLeaderboardRows = data;
        return { count: data.length };
      }
    },
    groupMember: {
      async findMany() {
        return [
          {
            userId: "user-1",
            createdAt: new Date("2026-01-01"),
            user: { wallet: { balance: 5000 } }
          }
        ];
      }
    }
  };

  mockPrismaTransaction(tx);

  const group = await createGroup({
    userEmail: "captain@stakeipl.app",
    name: "Night Watch",
    slug: "night-watch"
  });

  assert.equal(group.slug, "night-watch");
  assert.equal((createdGroupPayload?.members as { create: { userId: string } }).create.userId, "user-1");
  assert.ok(groupLeaderboardRows.some((row) => row.scope === "GROUP"));
});

test("joinGroup adds member and recomputes group leaderboards", async () => {
  const createdMemberships: Array<Record<string, unknown>> = [];
  let deleteCalls = 0;

  const tx = {
    user: {
      async findUnique() {
        return {
          id: "admin-1",
          email: "admin@stakeipl.app",
          wallet: { id: "wallet-2", balance: 5000 }
        };
      }
    },
    group: {
      async findUnique() {
        return { id: "group-1", name: "Night Watch", slug: "night-watch" };
      },
      async findMany() {
        return [{ id: "group-1" }];
      }
    },
    groupMember: {
      async create({ data }: { data: Record<string, unknown> }) {
        createdMemberships.push(data);
        return {};
      },
      async findMany() {
        return [
          {
            userId: "user-1",
            createdAt: new Date("2026-01-01"),
            user: { wallet: { balance: 5200 } }
          },
          {
            userId: "admin-1",
            createdAt: new Date("2026-01-02"),
            user: { wallet: { balance: 5000 } }
          }
        ];
      }
    },
    leaderboardEntry: {
      async deleteMany() {
        deleteCalls += 1;
        return { count: 0 };
      },
      async createMany() {
        return { count: 2 };
      }
    }
  };

  mockPrismaTransaction(tx);

  const group = await joinGroup({
    userEmail: "admin@stakeipl.app",
    slug: "night-watch"
  });

  assert.equal(group.slug, "night-watch");
  assert.deepEqual(createdMemberships[0], { groupId: "group-1", userId: "admin-1" });
  assert.ok(deleteCalls >= 1);
});
