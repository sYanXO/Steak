import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type HomepageOutcome = {
  id: string;
  label: string;
  currentOdds: number;
  totalStaked: number;
  oddsSnapshots: Array<{
    recordedAt: string;
    oddsValue: number;
  }>;
};

export type HomepageMarket = {
  id: string;
  title: string;
  closesAt: string;
  match: {
    homeTeam: string;
    awayTeam: string;
  };
  outcomes: HomepageOutcome[];
};

export type HomepageData = {
  userCount: number;
  openMarkets: HomepageMarket[];
  featuredMarket: HomepageMarket | null;
  totalStaked: number;
};

export const getHomepageData = unstable_cache(
  async (): Promise<HomepageData> => {
    const [userCount, openMarkets, totalStaked] = await Promise.all([
      prisma.user.count(),
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: [{ closesAt: "asc" }],
        take: 6,
        select: {
          id: true,
          title: true,
          closesAt: true,
          match: {
            select: {
              homeTeam: true,
              awayTeam: true
            }
          },
          outcomes: {
            select: {
              id: true,
              label: true,
              currentOdds: true,
              totalStaked: true,
              oddsSnapshots: {
                orderBy: { recordedAt: "asc" },
                take: 12,
                select: {
                  recordedAt: true,
                  oddsValue: true
                }
              }
            },
            orderBy: { order: "asc" }
          }
        }
      }),
      prisma.marketOutcome.aggregate({
        _sum: { totalStaked: true }
      })
    ]);

    const mappedOpenMarkets: HomepageMarket[] = openMarkets.map((market) => ({
      id: market.id,
      title: market.title,
      closesAt: market.closesAt.toISOString(),
      match: {
        homeTeam: market.match.homeTeam,
        awayTeam: market.match.awayTeam
      },
      outcomes: market.outcomes.map((outcome) => ({
        id: outcome.id,
        label: outcome.label,
        currentOdds: Number(outcome.currentOdds),
        totalStaked: outcome.totalStaked,
        oddsSnapshots: outcome.oddsSnapshots.map((snapshot) => ({
          recordedAt: snapshot.recordedAt.toISOString(),
          oddsValue: Number(snapshot.oddsValue)
        }))
      }))
    }));

    const featuredMarket: HomepageMarket | null =
      mappedOpenMarkets
        .slice()
        .sort((left, right) => {
          const leftSnapshots = left.outcomes.reduce(
            (sum, outcome) => sum + outcome.oddsSnapshots.length,
            0
          );
          const rightSnapshots = right.outcomes.reduce(
            (sum, outcome) => sum + outcome.oddsSnapshots.length,
            0
          );

          return rightSnapshots - leftSnapshots;
        })[0] ?? null;

    return {
      userCount,
      openMarkets: mappedOpenMarkets,
      featuredMarket,
      totalStaked: totalStaked._sum.totalStaked ?? 0
    };
  },
  ["homepage-data"],
  { revalidate: 30 }
);
