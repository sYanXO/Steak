import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { measureAsync } from "@/lib/observability";
import { prisma } from "@/lib/prisma";

type DashboardDataInput = {
  userId: string;
  walletPage: number;
  stakesPage: number;
  leaderboardPage: number;
  walletPageSize: number;
  stakesPageSize: number;
  leaderboardPageSize: number;
};

export const getDashboardPageData = unstable_cache(
  async ({
    userId,
    walletPage,
    stakesPage,
    leaderboardPage,
    walletPageSize,
    stakesPageSize,
    leaderboardPageSize
  }: DashboardDataInput) => {
    return measureAsync(
      "dashboard.page-data",
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            wallet: {
              select: {
                id: true,
                balance: true,
                entries: {
                  orderBy: { createdAt: "desc" },
                  skip: (walletPage - 1) * walletPageSize,
                  take: walletPageSize,
                  select: {
                    id: true,
                    type: true,
                    reason: true,
                    amountDelta: true,
                    createdAt: true
                  }
                }
              }
            },
            stakes: {
              orderBy: { createdAt: "desc" },
              skip: (stakesPage - 1) * stakesPageSize,
              take: stakesPageSize,
              select: {
                id: true,
                amount: true,
                quotedOdds: true,
                result: true,
                payoutAmount: true,
                settledAt: true,
                market: {
                  select: {
                    title: true
                  }
                },
                outcome: {
                  select: {
                    label: true
                  }
                }
              }
            },
            leaderboard: {
              where: { scope: "GLOBAL" },
              take: 1,
              select: { rank: true }
            },
            memberships: {
              select: {
                group: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                    leaderboard: {
                      where: { scope: "GROUP" },
                      orderBy: { rank: "asc" },
                      take: 3,
                      select: {
                        userId: true,
                        rank: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (!user?.wallet) {
          return null;
        }

        const [
          pendingStakeCount,
          totalStakeCount,
          totalWalletEntryCount,
          leaderboardEntries,
          totalLeaderboardCount
        ] = await Promise.all([
          prisma.stake.count({
            where: {
              userId,
              result: "PENDING"
            }
          }),
          prisma.stake.count({
            where: {
              userId
            }
          }),
          prisma.ledgerEntry.count({
            where: {
              walletId: user.wallet.id
            }
          }),
          prisma.leaderboardEntry.findMany({
            where: { scope: "GLOBAL" },
            orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
            skip: (leaderboardPage - 1) * leaderboardPageSize,
            take: leaderboardPageSize,
            select: {
              rank: true,
              balance: true,
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }),
          prisma.leaderboardEntry.count({
            where: { scope: "GLOBAL" }
          })
        ]);

        return {
          user,
          pendingStakeCount,
          totalStakeCount,
          totalWalletEntryCount,
          leaderboardEntries,
          totalLeaderboardCount
        };
      },
      { userId, walletPage, stakesPage, leaderboardPage }
    );
  },
  ["dashboard-page-data"],
  { revalidate: 15 }
);

export function getDashboardPageDataCached(input: DashboardDataInput) {
  const cached = unstable_cache(
    () => getDashboardPageData(input),
    [
      cacheTags.dashboard(input.userId),
      `wallet:${input.walletPage}`,
      `stakes:${input.stakesPage}`,
      `leaderboard:${input.leaderboardPage}`
    ],
    { revalidate: 15, tags: [cacheTags.dashboard(input.userId)] }
  );

  return cached();
}
