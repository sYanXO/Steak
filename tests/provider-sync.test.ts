import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { syncCricketDataMatches } from "@/lib/services/provider-sync";

test("syncCricketDataMatches upserts provider-owned matches and reports create vs update counts", async () => {
  const originalFetch = global.fetch;
  const originalMatchFindMany = prisma.match.findMany;
  const originalMatchUpsert = prisma.match.upsert;
  const originalMatchDeleteMany = prisma.match.deleteMany;

  const upserts: Array<Record<string, unknown>> = [];
  const deletedIds: string[][] = [];

  global.fetch = (async () =>
    ({
      ok: true,
      async json() {
        return {
          data: [
            {
              id: "provider-match-1",
              name: "IPL 2026: Mumbai Indians vs Chennai Super Kings",
              status: "Mumbai Indians won by 7 wickets",
              dateTimeGMT: "2026-04-01T14:00:00.000Z",
              teams: ["Mumbai Indians", "Chennai Super Kings"],
              tossWinner: "Mumbai Indians",
              tossChoice: "bat",
              winner: "Mumbai Indians"
            },
            {
              id: "provider-match-2",
              name: "Indian Premier League: Royal Challengers Bengaluru vs Gujarat Titans",
              status: "Match not started",
              dateTimeGMT: "2026-04-02T14:00:00.000Z",
              teams: ["Royal Challengers Bengaluru", "Gujarat Titans"]
            }
          ]
        };
      }
    }) as Response) as typeof fetch;

  prisma.match.findMany = ((async ({
    where
  }: {
    where?: {
      providerMatchId?: { in?: string[] };
      provider?: string;
      stakes?: { none?: Record<string, never> };
    };
  }) => {
    if (where?.providerMatchId?.in) {
      return (where.providerMatchId.in ?? []).includes("provider-match-1")
        ? [{ providerMatchId: "provider-match-1" }]
        : [];
    }

    if (where?.provider === "CRICKETDATA") {
      return [{ id: "stale-provider-match" }];
    }

    return [];
  }) as unknown) as typeof prisma.match.findMany;

  prisma.match.upsert = ((async ({ create, update, where }: Record<string, unknown>) => {
    upserts.push({ create, update, where });
    return {} as never;
  }) as unknown) as typeof prisma.match.upsert;

  prisma.match.deleteMany = ((async ({
    where
  }: {
    where?: { id?: { in?: string[] } };
  }) => {
    deletedIds.push(where?.id?.in ?? []);
    return { count: where?.id?.in?.length ?? 0 } as never;
  }) as unknown) as typeof prisma.match.deleteMany;

  try {
    const summary = await syncCricketDataMatches("api-key");

    assert.deepEqual(summary, {
      syncedMatchCount: 2,
      createdMatchCount: 1,
      updatedMatchCount: 1,
      prunedMatchCount: 1
    });
    assert.equal(upserts.length, 2);
    assert.deepEqual(deletedIds, [["stale-provider-match"]]);
    assert.equal(
      (upserts[0]?.where as { providerMatchId?: string }).providerMatchId,
      "provider-match-1"
    );
    assert.equal(
      (upserts[0]?.update as { winnerTeam?: string | null }).winnerTeam,
      "Mumbai Indians"
    );
    assert.equal(
      (upserts[1]?.create as { status?: string }).status,
      "SCHEDULED"
    );
  } finally {
    global.fetch = originalFetch;
    prisma.match.findMany = originalMatchFindMany;
    prisma.match.upsert = originalMatchUpsert;
    prisma.match.deleteMany = originalMatchDeleteMany;
  }
});
