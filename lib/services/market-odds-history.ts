import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SnapshotInput = {
  marketId: string;
  outcomeId: string;
  currentOdds: number | Prisma.Decimal;
  totalStaked: number;
};

export async function recordMarketOutcomeSnapshots(
  db: Prisma.TransactionClient | typeof prisma,
  outcomes: SnapshotInput[],
  recordedAt = new Date()
) {
  if (outcomes.length === 0) {
    return;
  }

  await db.outcomeOddsSnapshot.createMany({
    data: outcomes.map((outcome) => ({
      marketId: outcome.marketId,
      outcomeId: outcome.outcomeId,
      oddsValue:
        outcome.currentOdds instanceof Prisma.Decimal
          ? outcome.currentOdds
          : new Prisma.Decimal(Number(outcome.currentOdds).toFixed(4)),
      totalStaked: outcome.totalStaked,
      recordedAt
    }))
  });
}
