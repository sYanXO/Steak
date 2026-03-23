import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getHomepageData = unstable_cache(
  async () => {
    const [userCount, openMarkets, totalStaked] = await Promise.all([
      prisma.user.count(),
      prisma.market.findMany({
        where: { status: "OPEN" },
        orderBy: [{ closesAt: "asc" }],
        take: 6,
        include: {
          match: true,
          outcomes: {
            orderBy: { order: "asc" }
          }
        }
      }),
      prisma.marketOutcome.aggregate({
        _sum: { totalStaked: true }
      })
    ]);

    return {
      userCount,
      openMarkets: openMarkets.map((market) => ({
        id: market.id,
        title: market.title,
        closesAt: market.closesAt.toISOString(),
        match: {
          homeTeam: market.match.homeTeam,
          awayTeam: market.match.awayTeam
        },
        outcomes: market.outcomes.map((outcome) => ({
          label: outcome.label,
          currentOdds: Number(outcome.currentOdds),
          totalStaked: outcome.totalStaked
        }))
      })),
      totalStaked: totalStaked._sum.totalStaked ?? 0
    };
  },
  ["homepage-data"],
  { revalidate: 30 }
);
