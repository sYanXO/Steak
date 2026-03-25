import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordMarketOutcomeSnapshots } from "@/lib/services/market-odds-history";
import { settleMarketAutomatically } from "@/lib/services/settle-market";

const MATCH_WINNER_KEY = "MATCH_WINNER";
const TOSS_WINNER_KEY = "TOSS_WINNER";
const MATCH_WINNER_TITLE = "Match winner";
const TOSS_WINNER_TITLE = "Toss winner";
const DEFAULT_OPEN_LEAD_HOURS = 24;
const DEFAULT_TOSS_CLOSE_LEAD_MINUTES = 15;

type AutomationSummary = {
  createdMarketCount: number;
  openedMarketCount: number;
  closedMarketCount: number;
  settledMarketCount: number;
  liveMatchCount: number;
  completedMatchCount: number;
  createdMarketIds: string[];
  openedMarketIds: string[];
  closedMarketIds: string[];
  settledMarketIds: string[];
};

type MarketAutomationDeps = {
  prisma: typeof prisma;
  settleMarketAutomatically: typeof settleMarketAutomatically;
};

function computeMarketStatus(now: Date, opensAt: Date, closesAt: Date) {
  if (closesAt <= now) {
    return "CLOSED" as const;
  }

  if (opensAt <= now) {
    return "OPEN" as const;
  }

  return "DRAFT" as const;
}

function getAutomationAdminId(admins: Array<{ id: string }>) {
  return admins[0]?.id ?? null;
}

function getAutoSettlementLabel(match: {
  automationKey: string | null;
  tossWinner: string | null;
  winnerTeam: string | null;
}) {
  if (match.automationKey === MATCH_WINNER_KEY) {
    return match.winnerTeam;
  }

  if (match.automationKey === TOSS_WINNER_KEY) {
    return match.tossWinner;
  }

  return null;
}

type AutomationDbClient = Prisma.TransactionClient | typeof prisma;

async function createAutomatedMarket(
  db: AutomationDbClient,
  input: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    startsAt: Date;
    adminId: string | null;
    automationKey: string;
    title: string;
    closesAt: Date;
    now: Date;
  }
) {
  const opensAt = new Date(input.startsAt.getTime() - DEFAULT_OPEN_LEAD_HOURS * 60 * 60 * 1000);
  const seededOdds = new Prisma.Decimal("2.0000");
  const status = computeMarketStatus(input.now, opensAt, input.closesAt);

  const market = await db.market.create({
    data: {
      matchId: input.matchId,
      title: input.title,
      type: input.automationKey,
      status,
      opensAt,
      closesAt: input.closesAt,
      automationEnabled: true,
      autoCreated: true,
      automationKey: input.automationKey,
      pricingMetadata: {
        model: "pool-based",
        virtualLiquidity: 1000,
        automation: true
      },
      outcomes: {
        create: [input.homeTeam, input.awayTeam].map((label, index) => ({
          label,
          order: index + 1,
          currentOdds: seededOdds,
          totalStaked: 0
        }))
      }
    },
    include: {
      outcomes: true
    }
  });

  if (input.adminId) {
    await db.adminActionLog.create({
      data: {
        adminId: input.adminId,
        actionType: "MARKET_CREATED",
        targetType: "Market",
        targetId: market.id,
        reason: `Auto-created ${market.title}`,
        metadata: {
          matchId: input.matchId,
          automationKey: input.automationKey,
          autoCreated: true
        }
      }
    });
  }

  await recordMarketOutcomeSnapshots(
    db as Prisma.TransactionClient,
    market.outcomes.map((outcome) => ({
      marketId: market.id,
      outcomeId: outcome.id,
      currentOdds: outcome.currentOdds,
      totalStaked: outcome.totalStaked
    })),
    opensAt
  );

  return market.id;
}

export async function runMarketAutomation(
  now = new Date(),
  deps: MarketAutomationDeps = {
    prisma,
    settleMarketAutomatically
  }
): Promise<AutomationSummary> {
  const db = deps.prisma;

  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    take: 1,
    select: { id: true }
  });

  const adminId = getAutomationAdminId(admins);

  const matches = await db.match.findMany({
    where: {
      status: {
        in: ["SCHEDULED", "LIVE"]
      }
    },
    include: {
      markets: {
        select: {
          automationKey: true
        }
      }
    }
  });

  const createdMarketIds: string[] = [];

  for (const match of matches) {
    const existingKeys = new Set(
      match.markets
        .map((market) => market.automationKey)
        .filter((value): value is string => Boolean(value))
    );

    if (!existingKeys.has(MATCH_WINNER_KEY)) {
      createdMarketIds.push(
        await createAutomatedMarket(db, {
          matchId: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          startsAt: match.startsAt,
          adminId,
          automationKey: MATCH_WINNER_KEY,
          title: MATCH_WINNER_TITLE,
          closesAt: match.startsAt,
          now
        })
      );
    }

    if (!existingKeys.has(TOSS_WINNER_KEY)) {
      const tossCloseAt = new Date(
        match.startsAt.getTime() - DEFAULT_TOSS_CLOSE_LEAD_MINUTES * 60 * 1000
      );

      createdMarketIds.push(
        await createAutomatedMarket(db, {
          matchId: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          startsAt: match.startsAt,
          adminId,
          automationKey: TOSS_WINNER_KEY,
          title: TOSS_WINNER_TITLE,
          closesAt: tossCloseAt,
          now
        })
      );
    }
  }

  const liveMatches = await db.match.updateMany({
    where: {
      status: "SCHEDULED",
      startsAt: {
        lte: now
      },
      winnerTeam: null
    },
    data: {
      status: "LIVE"
    }
  });

  const completedMatches = await db.match.updateMany({
    where: {
      status: {
        in: ["SCHEDULED", "LIVE"]
      },
      OR: [
        {
          winnerTeam: {
            not: null
          }
        },
        {
          completedAt: {
            not: null
          }
        }
      ]
    },
    data: {
      status: "COMPLETED"
    }
  });

  const openedMarketCandidates = await db.market.findMany({
    where: {
      automationEnabled: true,
      status: "DRAFT",
      opensAt: {
        lte: now
      },
      closesAt: {
        gt: now
      }
    },
    select: {
      id: true
    }
  });

  const openedMarketIds = openedMarketCandidates.map((market) => market.id);

  if (openedMarketIds.length > 0) {
    await db.market.updateMany({
      where: {
        id: {
          in: openedMarketIds
        }
      },
      data: {
        status: "OPEN"
      }
    });
  }

  const closedMarketCandidates = await db.market.findMany({
    where: {
      automationEnabled: true,
      status: "OPEN",
      closesAt: {
        lte: now
      }
    },
    select: {
      id: true
    }
  });

  const closedMarketIds = closedMarketCandidates.map((market) => market.id);

  if (closedMarketIds.length > 0) {
    await db.market.updateMany({
      where: {
        id: {
          in: closedMarketIds
        }
      },
      data: {
        status: "CLOSED"
      }
    });
  }

  const settleCandidates = await db.market.findMany({
    where: {
      automationEnabled: true,
      automationKey: {
        in: [MATCH_WINNER_KEY, TOSS_WINNER_KEY]
      },
      status: {
        in: ["OPEN", "CLOSED"]
      }
    },
    select: {
      id: true,
      status: true,
      automationKey: true,
      match: {
        select: {
          tossWinner: true,
          winnerTeam: true
        }
      },
      outcomes: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          label: true
        }
      }
    }
  });

  let settledMarketCount = 0;
  const settledMarketIds: string[] = [];

  for (const market of settleCandidates) {
    const winnerLabel = getAutoSettlementLabel({
      automationKey: market.automationKey,
      tossWinner: market.match.tossWinner,
      winnerTeam: market.match.winnerTeam
    });

    if (!winnerLabel) {
      continue;
    }

    const winningOutcome = market.outcomes.find((outcome) => outcome.label === winnerLabel);

    if (!winningOutcome) {
      continue;
    }

    await deps.settleMarketAutomatically({
      marketId: market.id,
      outcomeId: winningOutcome.id,
      actorId: adminId
    });

    settledMarketCount += 1;
    settledMarketIds.push(market.id);
  }

  return {
    createdMarketCount: createdMarketIds.length,
    openedMarketCount: openedMarketIds.length,
    closedMarketCount: closedMarketIds.length,
    settledMarketCount,
    liveMatchCount: liveMatches.count,
    completedMatchCount: completedMatches.count,
    createdMarketIds,
    openedMarketIds,
    closedMarketIds,
    settledMarketIds
  };
}
