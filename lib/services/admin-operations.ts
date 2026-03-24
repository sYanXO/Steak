import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  recomputeAllGroupLeaderboards,
  recomputeGlobalLeaderboard
} from "@/lib/services/leaderboard";
import { recordMarketOutcomeSnapshots } from "@/lib/services/market-odds-history";
import {
  createMarketSchema,
  createMatchSchema,
  manualTopUpSchema,
  updateMarketStatusSchema
} from "@/lib/validation/admin";

type AdminIdentity = {
  adminId: string;
};

type CreateMatchInput = AdminIdentity & {
  title: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
};

type CreateMarketInput = AdminIdentity & {
  matchId: string;
  title: string;
  type: string;
  opensAt: string;
  closesAt: string;
  outcomes: string;
};

type UpdateMarketStatusInput = AdminIdentity & {
  marketId: string;
  status: "DRAFT" | "OPEN" | "CLOSED" | "VOID";
};

type ManualTopUpInput = AdminIdentity & {
  userId: string;
  amount: number;
  reason: string;
};

function formatAdminUtc(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short"
  }).format(value);
}

async function requireAdmin(tx: Prisma.TransactionClient, userId: string) {
  const admin = await tx.user.findUnique({
    where: { id: userId }
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Admin authorization required.");
  }

  return admin;
}

export async function createMatch(rawInput: CreateMatchInput) {
  const input = createMatchSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const admin = await requireAdmin(tx, rawInput.adminId);
    const startsAt = new Date(input.startsAt);

    const match = await tx.match.create({
      data: {
        title: input.title,
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        startsAt,
        status: "SCHEDULED"
      }
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.id,
        actionType: "MATCH_CREATED",
        targetType: "Match",
        targetId: match.id,
        reason: `Created match ${match.homeTeam} vs ${match.awayTeam}`,
        metadata: {
          startsAt: startsAt.toISOString()
        }
      }
    });

    return match;
  });
}

export async function createMarket(rawInput: CreateMarketInput) {
  const input = createMarketSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const admin = await requireAdmin(tx, rawInput.adminId);
    const opensAt = new Date(input.opensAt);
    const closesAt = new Date(input.closesAt);

    if (closesAt <= opensAt) {
      throw new Error("Close time must be after open time.");
    }

    const match = await tx.match.findUnique({
      where: { id: input.matchId }
    });

    if (!match) {
      throw new Error("Selected match was not found.");
    }

    if (closesAt > match.startsAt) {
      throw new Error(
        `Market must close before the match starts. Match start: ${formatAdminUtc(
          match.startsAt
        )}. Submitted close: ${formatAdminUtc(closesAt)}.`
      );
    }

    const outcomeCount = input.outcomes.length;
    const seededOdds = Math.max(1.01, outcomeCount);

    const market = await tx.market.create({
      data: {
        matchId: match.id,
        title: input.title,
        type: input.type,
        status: opensAt <= new Date() ? "OPEN" : "DRAFT",
        opensAt,
        closesAt,
        pricingMetadata: {
          model: "pool-based",
          virtualLiquidity: 1000
        },
        outcomes: {
          create: input.outcomes.map((label, index) => ({
            label,
            order: index + 1,
            currentOdds: new Prisma.Decimal(seededOdds.toFixed(4)),
            totalStaked: 0
          }))
        }
      },
      include: {
        outcomes: true
      }
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.id,
        actionType: "MARKET_CREATED",
        targetType: "Market",
        targetId: market.id,
        reason: `Created market ${market.title}`,
        metadata: {
          matchId: match.id,
          outcomes: input.outcomes
        }
      }
    });

    await recordMarketOutcomeSnapshots(
      tx,
      market.outcomes.map((outcome) => ({
        marketId: market.id,
        outcomeId: outcome.id,
        currentOdds: outcome.currentOdds,
        totalStaked: outcome.totalStaked
      })),
      opensAt
    );

    return market;
  });
}

export async function updateMarketStatus(rawInput: UpdateMarketStatusInput) {
  const input = updateMarketStatusSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const admin = await requireAdmin(tx, rawInput.adminId);
    const market = await tx.market.findUnique({
      where: { id: input.marketId },
      include: {
        match: true
      }
    });

    if (!market) {
      throw new Error("Market not found.");
    }

    if (market.status === "SETTLED") {
      throw new Error("Settled markets cannot be moved to another status.");
    }

    if (input.status === "OPEN" && market.closesAt <= new Date()) {
      throw new Error("Cannot reopen a market after its close time.");
    }

    const updatedMarket = await tx.market.update({
      where: { id: market.id },
      data: {
        status: input.status
      }
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.id,
        actionType: "MARKET_STATUS_CHANGED",
        targetType: "Market",
        targetId: market.id,
        reason: `Changed ${market.title} to ${input.status}`,
        metadata: {
          previousStatus: market.status,
          newStatus: input.status
        }
      }
    });

    return updatedMarket;
  });
}

export async function manualTopUp(rawInput: ManualTopUpInput) {
  const input = manualTopUpSchema.parse(rawInput);

  return prisma.$transaction(async (tx) => {
    const admin = await requireAdmin(tx, rawInput.adminId);
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      include: { wallet: true }
    });

    if (!user?.wallet) {
      throw new Error("Selected user does not have a wallet.");
    }

    const balanceAfter = user.wallet.balance + input.amount;

    await tx.wallet.update({
      where: { id: user.wallet.id },
      data: {
        balance: balanceAfter
      }
    });

    const ledgerEntry = await tx.ledgerEntry.create({
      data: {
        walletId: user.wallet.id,
        type: "ADMIN_TOP_UP",
        amountDelta: input.amount,
        balanceAfter,
        reason: input.reason,
        actorId: admin.id,
        relatedEntityId: user.id
      }
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.id,
        actionType: "BALANCE_TOP_UP",
        targetType: "User",
        targetId: user.id,
        reason: input.reason,
        metadata: {
          amount: input.amount,
          ledgerEntryId: ledgerEntry.id
        }
      }
    });

    await recomputeGlobalLeaderboard(tx);
    await recomputeAllGroupLeaderboards(tx);

    return {
      userId: user.id,
      userLabel: user.name ?? user.email,
      amount: input.amount,
      balanceAfter
    };
  });
}
