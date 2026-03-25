import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchCricketDataMatches } from "@/lib/providers/cricketdata";

type SyncSummary = {
  syncedMatchCount: number;
  createdMatchCount: number;
  updatedMatchCount: number;
  prunedMatchCount: number;
};

export async function syncCricketDataMatches(apiKey: string): Promise<SyncSummary> {
  const matches = await fetchCricketDataMatches(apiKey);
  const providerMatchIds = matches.map((match) => match.providerMatchId);
  const existingMatches =
    providerMatchIds.length === 0
      ? []
      : await prisma.match.findMany({
          where: {
            providerMatchId: {
              in: providerMatchIds
            }
          },
          select: {
            providerMatchId: true
          }
        });
  const existingIds = new Set(
    existingMatches
      .map((match) => match.providerMatchId)
      .filter((value): value is string => Boolean(value))
  );
  let createdMatchCount = 0;
  let updatedMatchCount = 0;

  const staleProviderMatches = await prisma.match.findMany({
    where: {
      provider: "CRICKETDATA",
      providerMatchId: {
        notIn: providerMatchIds.length > 0 ? providerMatchIds : [""]
      },
      markets: {
        none: {
          stakes: {
            some: {}
          }
        }
      }
    },
    select: {
      id: true
    }
  });

  for (const match of matches) {
    const where: Prisma.MatchWhereUniqueInput = {
      providerMatchId: match.providerMatchId
    };
    const updateData: Prisma.MatchUpdateInput = {
      title: match.title,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startsAt: match.startsAt,
      status: match.status,
      tossWinner: match.tossWinner,
      tossDecision: match.tossDecision,
      winnerTeam: match.winnerTeam,
      completedAt: match.completedAt,
      lastSyncedAt: new Date()
    };
    const createData: Prisma.MatchCreateInput = {
      provider: match.provider,
      providerMatchId: match.providerMatchId,
      title: match.title,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startsAt: match.startsAt,
      status: match.status,
      tossWinner: match.tossWinner,
      tossDecision: match.tossDecision,
      winnerTeam: match.winnerTeam,
      completedAt: match.completedAt,
      lastSyncedAt: new Date()
    };

    if (existingIds.has(match.providerMatchId)) {
      updatedMatchCount += 1;
    } else {
      createdMatchCount += 1;
    }

    await prisma.match.upsert({
      where,
      update: updateData,
      create: createData
    });
  }

  const staleMatchIds = staleProviderMatches.map((match) => match.id);

  if (staleMatchIds.length > 0) {
    await prisma.match.deleteMany({
      where: {
        id: {
          in: staleMatchIds
        }
      }
    });
  }

  return {
    syncedMatchCount: matches.length,
    createdMatchCount,
    updatedMatchCount,
    prunedMatchCount: staleMatchIds.length
  };
}
