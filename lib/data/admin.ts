import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { measureAsync } from "@/lib/observability";
import { prisma } from "@/lib/prisma";

type AdminPageDataInput = {
  pendingPage: number;
  matchesPage: number;
  recoveryPage: number;
  settlementsPage: number;
  topUpsPage: number;
  pageSize: number;
  searchTerm: string;
};

export const getAdminPageData = unstable_cache(
  async ({
    pendingPage,
    matchesPage,
    recoveryPage,
    settlementsPage,
    topUpsPage,
    pageSize,
    searchTerm
  }: AdminPageDataInput) => {
    const trimmedSearchTerm = searchTerm.trim();
    const hasSearch = trimmedSearchTerm.length > 0;

    return measureAsync(
      "admin.page-data",
      async () =>
        Promise.all([
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
            where: {
              status: {
                not: "ARCHIVED"
              }
            },
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
              tossWinner: true,
              tossDecision: true,
              winnerTeam: true,
              completedAt: true,
              _count: {
                select: {
                  markets: true
                }
              }
            }
          }),
          prisma.match.count({
            where: {
              status: {
                not: "ARCHIVED"
              }
            }
          }),
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
          }),
          hasSearch
            ? prisma.user.findMany({
                where: {
                  OR: [
                    {
                      name: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    },
                    {
                      email: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    }
                  ]
                },
                orderBy: [{ createdAt: "desc" }],
                take: 5,
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  wallet: {
                    select: {
                      balance: true
                    }
                  }
                }
              })
            : Promise.resolve([]),
          hasSearch
            ? prisma.group.findMany({
                where: {
                  OR: [
                    {
                      name: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    },
                    {
                      slug: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    }
                  ]
                },
                orderBy: [{ createdAt: "desc" }],
                take: 5,
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  owner: {
                    select: {
                      name: true,
                      email: true
                    }
                  },
                  _count: {
                    select: {
                      members: true
                    }
                  }
                }
              })
            : Promise.resolve([]),
          hasSearch
            ? prisma.match.findMany({
                where: {
                  status: {
                    not: "ARCHIVED"
                  },
                  OR: [
                    {
                      title: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    },
                    {
                      homeTeam: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    },
                    {
                      awayTeam: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    }
                  ]
                },
                orderBy: [{ startsAt: "asc" }],
                take: 5,
                select: {
                  id: true,
                  title: true,
                  homeTeam: true,
                  awayTeam: true,
                  startsAt: true,
                  status: true,
                  tossWinner: true,
                  tossDecision: true,
                  winnerTeam: true,
                  completedAt: true,
                  _count: {
                    select: {
                      markets: true
                    }
                  }
                }
              })
            : Promise.resolve([]),
          hasSearch
            ? prisma.market.findMany({
                where: {
                  OR: [
                    {
                      title: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    },
                    {
                      type: {
                        contains: trimmedSearchTerm,
                        mode: "insensitive"
                      }
                    },
                    {
                      match: {
                        title: {
                          contains: trimmedSearchTerm,
                          mode: "insensitive"
                        }
                      }
                    },
                    {
                      match: {
                        homeTeam: {
                          contains: trimmedSearchTerm,
                          mode: "insensitive"
                        }
                      }
                    },
                    {
                      match: {
                        awayTeam: {
                          contains: trimmedSearchTerm,
                          mode: "insensitive"
                        }
                      }
                    }
                  ]
                },
                orderBy: [{ closesAt: "asc" }],
                take: 5,
                select: {
                  id: true,
                  title: true,
                  type: true,
                  status: true,
                  closesAt: true,
                  match: {
                    select: {
                      title: true,
                      homeTeam: true,
                      awayTeam: true
                    }
                  },
                  _count: {
                    select: {
                      stakes: true
                    }
                  }
                }
              })
            : Promise.resolve([])
        ]),
      { pendingPage, matchesPage, recoveryPage, settlementsPage, topUpsPage, hasSearch }
    ).then(
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
        totalLedgerVolume,
        searchUsers,
        searchGroups,
        searchMatches,
        searchMarkets
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
        totalLedgerVolume,
        searchResults: {
          term: trimmedSearchTerm,
          users: searchUsers,
          groups: searchGroups,
          matches: searchMatches,
          markets: searchMarkets
        }
      })
    );
  },
  ["admin-page-data"],
  { revalidate: 15, tags: [cacheTags.admin] }
);
