import { PrismaClient, LedgerEntryType, MatchStatus, MarketStatus } from "@prisma/client";
import { assertDestructiveDbCommandAllowed } from "@/prisma/safety";
import { recomputeAllGroupLeaderboards, recomputeGlobalLeaderboard } from "@/lib/services/leaderboard";

const prisma = new PrismaClient();

const STARTER_BALANCE = 5000;

async function main() {
  assertDestructiveDbCommandAllowed("db:reset-demo");

  await prisma.$transaction(async (tx) => {
    const verificationMatches = await tx.match.findMany({
      where: {
        title: {
          startsWith: "Verification Match"
        }
      },
      select: { id: true }
    });

    if (verificationMatches.length > 0) {
      await tx.match.deleteMany({
        where: {
          id: {
            in: verificationMatches.map((match) => match.id)
          }
        }
      });
    }

    await tx.group.deleteMany({
      where: {
        slug: {
          startsWith: "verify-group-"
        }
      }
    });

    await tx.user.deleteMany({
      where: {
        email: {
          startsWith: "verify-"
        }
      }
    });

    const captain = await tx.user.findUnique({
      where: { email: "captain@stakeipl.app" },
      include: { wallet: true }
    });

    if (!captain?.wallet) {
      throw new Error("Seeded captain wallet is missing.");
    }

    await tx.stake.deleteMany({
      where: {
        userId: captain.id
      }
    });

    await tx.ledgerEntry.deleteMany({
      where: {
        walletId: captain.wallet.id,
        NOT: {
          type: LedgerEntryType.STARTER_GRANT
        }
      }
    });

    await tx.wallet.update({
      where: { id: captain.wallet.id },
      data: {
        balance: STARTER_BALANCE
      }
    });

    await tx.market.updateMany({
      where: { id: "seed-market-mi-csk-winner" },
      data: {
        status: MarketStatus.OPEN,
        settledAt: null,
        settledOutcomeId: null
      }
    });

    const seedOutcomes = await tx.marketOutcome.findMany({
      where: {
        marketId: "seed-market-mi-csk-winner"
      },
      orderBy: { order: "asc" }
    });

    if (seedOutcomes.length === 2) {
      await tx.outcomeOddsSnapshot.deleteMany({
        where: {
          marketId: "seed-market-mi-csk-winner"
        }
      });

      await tx.marketOutcome.update({
        where: { id: seedOutcomes[0].id },
        data: {
          totalStaked: 12400,
          currentOdds: 1.82
        }
      });

      await tx.marketOutcome.update({
        where: { id: seedOutcomes[1].id },
        data: {
          totalStaked: 10100,
          currentOdds: 2.17
        }
      });

      const baseRecordedAt = new Date("2026-03-24T12:30:00.000Z");
      const timeline = [
        { offsetMinutes: 0, odds: [2.08, 1.96] },
        { offsetMinutes: 15, odds: [2.02, 2.01] },
        { offsetMinutes: 30, odds: [1.95, 2.08] },
        { offsetMinutes: 45, odds: [1.9, 2.12] },
        { offsetMinutes: 60, odds: [1.86, 2.15] },
        { offsetMinutes: 75, odds: [1.82, 2.17] }
      ] as const;

      await tx.outcomeOddsSnapshot.createMany({
        data: timeline.flatMap((point) =>
          seedOutcomes.map((outcome, index) => ({
            marketId: "seed-market-mi-csk-winner",
            outcomeId: outcome.id,
            oddsValue: point.odds[index],
            totalStaked: index === 0 ? 12400 : 10100,
            recordedAt: new Date(baseRecordedAt.getTime() + point.offsetMinutes * 60_000)
          }))
        )
      });
    }

    await tx.match.updateMany({
      where: { id: "seed-match-mi-csk" },
      data: {
        status: MatchStatus.SCHEDULED
      }
    });

    await tx.adminActionLog.deleteMany({});
    await tx.leaderboardEntry.deleteMany({});

    await recomputeGlobalLeaderboard(tx);
    await recomputeAllGroupLeaderboards(tx);
  });

  console.log("Demo state reset.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
