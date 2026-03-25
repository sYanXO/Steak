import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchCricketDataMatches } from "@/lib/providers/cricketdata";

type SyncSummary = {
  syncedMatchCount: number;
  createdMatchCount: number;
  updatedMatchCount: number;
};

export async function syncCricketDataMatches(apiKey: string): Promise<SyncSummary> {
  const matches = await fetchCricketDataMatches(apiKey);
  let createdMatchCount = 0;
  let updatedMatchCount = 0;

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

    const existing = await prisma.match.findUnique({
      where,
      select: {
        id: true
      }
    });

    if (existing) {
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

  return {
    syncedMatchCount: matches.length,
    createdMatchCount,
    updatedMatchCount
  };
}
