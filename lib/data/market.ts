import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

export function getMarketPublicDataCached(marketId: string) {
  const cached = unstable_cache(
    async () => {
      return prisma.market.findUnique({
        where: { id: marketId },
        select: {
          id: true,
          title: true,
          status: true,
          closesAt: true,
          match: {
            select: {
              homeTeam: true,
              awayTeam: true,
              startsAt: true
            }
          },
          outcomes: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              label: true,
              currentOdds: true,
              totalStaked: true
            }
          },
          _count: {
            select: {
              stakes: {
                where: { result: "PENDING" }
              }
            }
          }
        }
      });
    },
    [cacheTags.market(marketId)],
    { revalidate: 15, tags: [cacheTags.market(marketId)] }
  );

  return cached();
}
