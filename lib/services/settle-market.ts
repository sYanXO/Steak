import { prisma } from "@/lib/prisma";
import {
  recomputeAllGroupLeaderboards,
  recomputeGlobalLeaderboard
} from "@/lib/services/leaderboard";
import { settleMarketSchema } from "@/lib/validation/admin";

export type SettleMarketInput = {
  marketId: string;
  outcomeId: string;
  adminId: string;
};

export async function settleMarket(rawInput: SettleMarketInput) {
  const input = settleMarketSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const admin = await tx.user.findUnique({
      where: { id: rawInput.adminId }
    });

    if (!admin || admin.role !== "ADMIN") {
      throw new Error("Admin authorization required.");
    }

    const market = await tx.market.findUnique({
      where: { id: input.marketId },
      include: {
        outcomes: {
          orderBy: { order: "asc" }
        },
        stakes: {
          where: { result: "PENDING" },
          include: {
            user: {
              include: {
                wallet: true
              }
            }
          }
        }
      }
    });

    if (!market) {
      throw new Error("Market not found.");
    }

    if (market.status === "SETTLED" || market.status === "VOID") {
      throw new Error("This market has already been finalized.");
    }

    const winningOutcome = market.outcomes.find((outcome) => outcome.id === input.outcomeId);

    if (!winningOutcome) {
      throw new Error("Selected outcome does not belong to this market.");
    }

    const settledAt = new Date();

    for (const stake of market.stakes) {
      const won = stake.outcomeId === winningOutcome.id;
      const payoutAmount = won ? Math.round(Number(stake.payoutBasis)) : 0;

      await tx.stake.update({
        where: { id: stake.id },
        data: {
          result: won ? "WON" : "LOST",
          payoutAmount,
          settledAt
        }
      });

      if (won) {
        const wallet = stake.user.wallet;

        if (!wallet) {
          throw new Error("Winning user wallet is missing.");
        }

        const balanceAfter = wallet.balance + payoutAmount;

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: balanceAfter
          }
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "SETTLEMENT_CREDIT",
            amountDelta: payoutAmount,
            balanceAfter,
            reason: `Settlement payout for ${market.title}: ${winningOutcome.label}`,
            relatedEntityId: stake.id,
            actorId: admin.id
          }
        });
      }
    }

    await tx.market.update({
      where: { id: market.id },
      data: {
        status: "SETTLED",
        settledOutcomeId: winningOutcome.id,
        settledAt
      }
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.id,
        actionType: "MARKET_SETTLED",
        targetType: "Market",
        targetId: market.id,
        reason: `Settled ${market.title} with outcome ${winningOutcome.label}`,
        metadata: {
          outcomeId: winningOutcome.id,
          settledStakeCount: market.stakes.length
        }
      }
    });

    await recomputeGlobalLeaderboard(tx);
    await recomputeAllGroupLeaderboards(tx);

    return {
      marketId: market.id,
      settledOutcome: winningOutcome.label,
      settledStakeCount: market.stakes.length
    };
  });
}
