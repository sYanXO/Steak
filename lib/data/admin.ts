import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

type AdminPageDataInput = {
  pendingPage: number;
  matchesPage: number;
  recoveryPage: number;
  settlementsPage: number;
  topUpsPage: number;
  pageSize: number;
};

export const getAdminPageData = unstable_cache(
  async ({
    pendingPage,
    matchesPage,
    recoveryPage,
    settlementsPage,
    topUpsPage,
    pageSize
  }: AdminPageDataInput) => {
    return Promise.all([
      prisma.market.findMany({
        where: {
          OR: [{ status: "DRAFT" }, { status: "OPEN" }, { status: "CLOSED" }]
        },
        orderBy: [{ closesAt: "asc" }],
        skip: (pendingPage - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          status: true,
          closesAt: true,
          match: {
            select: {
              homeTeam: true,
              awayTeam: true
            }
          },
          outcomes: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              label: true
            }
          },
          _count: {
            select: { stakes: true }
          }
        }
      }),
      prisma.market.count({
        where: {
          OR: [{ status: "DRAFT" }, { status: "OPEN" }, { status: "CLOSED" }]
        }
      }),
      prisma.match.findMany({
        orderBy: [{ startsAt: "asc" }],
        skip: (matchesPage - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          homeTeam: true,
          awayTeam: true,
          startsAt: true,
          status: true,
          _count: {
            select: {
              markets: true
            }
          }
        }
      }),
      prisma.match.count(),
      prisma.user.findMany({
        orderBy: [{ createdAt: "asc" }],
        take: 20,
        select: {
          id: true,
          name: true,
          email: true
        }
      }),
      prisma.adminActionLog.findMany({
        where: {
          actionType: "MARKET_SETTLED"
        },
        orderBy: { createdAt: "desc" },
        skip: (settlementsPage - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          reason: true,
          createdAt: true,
          admin: {
            select: { email: true, name: true }
          }
        }
      }),
      prisma.adminActionLog.count({
        where: {
          actionType: "MARKET_SETTLED"
        }
      }),
      prisma.ledgerEntry.findMany({
        where: {
          type: "ADMIN_TOP_UP"
        },
        orderBy: { createdAt: "desc" },
        skip: (topUpsPage - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          reason: true,
          amountDelta: true,
          createdAt: true,
          wallet: {
            select: {
              user: {
                select: { email: true, name: true }
              }
            }
          }
        }
      }),
      prisma.ledgerEntry.count({
        where: {
          type: "ADMIN_TOP_UP"
        }
      }),
      prisma.accountRecoveryRequest
        .findMany({
          where: { status: "OPEN" },
          orderBy: { createdAt: "desc" },
          skip: (recoveryPage - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            currentEmail: true,
            requestedEmail: true,
            reason: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
        .catch(() => []),
      prisma.accountRecoveryRequest.count({
        where: { status: "OPEN" }
      }).catch(() => 0),
      prisma.user.count(),
      prisma.ledgerEntry.aggregate({
        _sum: {
          amountDelta: true
        }
      })
    ]).then(
      ([
        pendingMarkets,
        pendingMarketsCount,
        upcomingMatches,
        upcomingMatchesCount,
        users,
        recentSettlements,
        recentSettlementsCount,
        recentTopUps,
        recentTopUpsCount,
        recoveryRequests,
        recoveryRequestCount,
        userCount,
        totalLedgerVolume
      ]) => ({
        pendingMarkets,
        pendingMarketsCount,
        upcomingMatches,
        upcomingMatchesCount,
        users,
        recentSettlements,
        recentSettlementsCount,
        recentTopUps,
        recentTopUpsCount,
        recoveryRequests,
        recoveryRequestCount,
        userCount,
        totalLedgerVolume
      })
    );
  },
  ["admin-page-data"],
  { revalidate: 15, tags: [cacheTags.admin] }
);
