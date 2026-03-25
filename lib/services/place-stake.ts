import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  recomputeAllGroupLeaderboards,
  recomputeGlobalLeaderboard
} from "@/lib/services/leaderboard";
import { recordMarketOutcomeSnapshots } from "@/lib/services/market-odds-history";
import { measureAsync } from "@/lib/observability";
import { placeStakeSchema } from "@/lib/validation/stake";

const VIRTUAL_LIQUIDITY = 1000;

export type PlaceStakeInput = {
  marketId: string;
  outcomeId: string;
  amount: number;
  userEmail: string;
};

export async function placeStake(rawInput: PlaceStakeInput) {
  const input = placeStakeSchema.parse(rawInput);

  return measureAsync(
    "stake.place",
    () =>
      prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { email: rawInput.userEmail.toLowerCase() },
          include: { wallet: true }
        });

        if (!user?.wallet) {
          throw new Error("You need an active wallet before placing a stake.");
        }

        const existingStake = await tx.stake.findFirst({
          where: {
            userId: user.id,
            marketId: input.marketId
          },
          select: {
            id: true,
            amount: true,
            outcome: {
              select: {
                label: true
              }
            }
          }
        });

        if (existingStake) {
          throw new Error(
            `You already placed a stake on ${existingStake.outcome.label} in this market.`
          );
        }

        const market = await tx.market.findUnique({
          where: { id: input.marketId },
          include: {
            match: true,
            outcomes: {
              orderBy: { order: "asc" }
            }
          }
        });

        if (!market) {
          throw new Error("Market not found.");
        }

        const now = new Date();

        if (market.status !== "OPEN") {
          throw new Error("This market is not open for staking.");
        }

        if (market.opensAt > now) {
          throw new Error("This market is not open yet.");
        }

        if (market.closesAt <= now || market.match.startsAt <= now) {
          throw new Error("This market is closed for staking.");
        }

        const selectedOutcome = market.outcomes.find((outcome) => outcome.id === input.outcomeId);

        if (!selectedOutcome) {
          throw new Error("Selected outcome does not belong to this market.");
        }

        if (user.wallet.balance < input.amount) {
          throw new Error("Insufficient balance for this stake.");
        }

        const quotedOdds = Number(selectedOutcome.currentOdds);
        const payoutBasis = Number((quotedOdds * input.amount).toFixed(4));
        const nextBalance = user.wallet.balance - input.amount;

        let stake;

        try {
          stake = await tx.stake.create({
            data: {
              userId: user.id,
              marketId: market.id,
              outcomeId: selectedOutcome.id,
              amount: input.amount,
              quotedOdds: new Prisma.Decimal(quotedOdds),
              payoutBasis: new Prisma.Decimal(payoutBasis)
            }
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            throw new Error("You have already placed a stake in this market.");
          }

          throw error;
        }

        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: nextBalance }
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: user.wallet.id,
            type: "STAKE_DEBIT",
            amountDelta: -input.amount,
            balanceAfter: nextBalance,
            reason: `Stake on ${market.title}: ${selectedOutcome.label}`,
            relatedEntityId: stake.id
          }
        });

        const updatedOutcomes = market.outcomes.map((outcome) => ({
          id: outcome.id,
          totalStaked:
            outcome.id === selectedOutcome.id ? outcome.totalStaked + input.amount : outcome.totalStaked
        }));

        const totalAdjustedPool = updatedOutcomes.reduce(
          (sum, outcome) => sum + outcome.totalStaked + VIRTUAL_LIQUIDITY,
          0
        );

        const repricedOutcomes = await Promise.all(
          updatedOutcomes.map((outcome) => {
            const adjustedStake = outcome.totalStaked + VIRTUAL_LIQUIDITY;
            const repricedOdds = Math.max(1.01, totalAdjustedPool / adjustedStake);

            return tx.marketOutcome.update({
              where: { id: outcome.id },
              data: {
                totalStaked: outcome.totalStaked,
                currentOdds: new Prisma.Decimal(repricedOdds.toFixed(4))
              }
            });
          })
        );

        await recordMarketOutcomeSnapshots(
          tx,
          repricedOutcomes.map((outcome) => ({
            marketId: outcome.marketId,
            outcomeId: outcome.id,
            currentOdds: outcome.currentOdds,
            totalStaked: outcome.totalStaked
          }))
        );

        await recomputeGlobalLeaderboard(tx);
        await recomputeAllGroupLeaderboards(tx);

        return {
          stakeId: stake.id,
          quotedOdds,
          payoutBasis,
          balanceAfter: nextBalance
        };
      }),
    { marketId: input.marketId, amount: input.amount }
  );
}
