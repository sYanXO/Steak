import { PrismaClient, LedgerEntryType, MatchStatus, MarketStatus } from "@prisma/client";
import { recomputeAllGroupLeaderboards, recomputeGlobalLeaderboard } from "@/lib/services/leaderboard";

const prisma = new PrismaClient();

const STARTER_BALANCE = 5000;

async function main() {
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
