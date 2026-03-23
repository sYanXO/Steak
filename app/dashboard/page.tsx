import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCoins, formatRelativeDelta, formatUtcDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      wallet: {
        select: {
          balance: true,
          entries: {
            orderBy: { createdAt: "desc" },
            take: 5,
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
    redirect("/sign-in");
  }

  const [pendingStakeCount, leaderboardEntries] = await Promise.all([
    prisma.stake.count({
      where: {
        userId: user.id,
        result: "PENDING"
      }
    }),
    prisma.leaderboardEntry.findMany({
      where: { scope: "GLOBAL" },
      orderBy: [{ rank: "asc" }, { createdAt: "asc" }],
      take: 10,
      select: {
        rank: true,
        balance: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })
  ]);
  const userRank = user.leaderboard[0]?.rank ?? null;

  return (
    <main className="app-shell py-8">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
        <Card className="rounded-[32px] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Personal dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold">Your active IPL position</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Stat
              title="Balance"
              value={formatCoins(user.wallet.balance)}
              detail="Coins available"
            />
            <Stat
              title="Open stakes"
              value={formatCoins(pendingStakeCount)}
              detail="Awaiting market settlement"
            />
            <Stat
              title="Global rank"
              value={userRank ? `#${userRank}` : "Unranked"}
              detail="Based on wallet balance"
            />
          </div>
        </Card>

        <Card className="rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Wallet activity
          </p>
          <div className="mt-4 space-y-3">
            {user.wallet.entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatLedgerLabel(entry.type, entry.reason)}</span>
                  <span className={entry.amountDelta > 0 ? "text-[var(--success)]" : ""}>
                    {formatRelativeDelta(entry.amountDelta)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatUtcDateTime(entry.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 rounded-[32px] p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Group standings
          </p>
          <a href="/groups" className="text-sm font-semibold text-[var(--accent-dark)]">
            Manage groups
          </a>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {user.memberships.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No group memberships yet.</p>
          ) : (
            user.memberships.map((membership) => {
              const personalEntry = membership.group.leaderboard.find(
                (entry) => entry.userId === user.id
              );

              return (
                <div
                  key={membership.group.id}
                  className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
                >
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                    {membership.group.slug}
                  </p>
                  <p className="mt-2 text-xl font-semibold">{membership.group.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Your rank: {personalEntry?.rank ? `#${personalEntry.rank}` : "Unranked"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="mt-6 rounded-[32px] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Leaderboard snapshot
        </p>
        <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line)]">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[var(--panel-strong)] text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Win rate</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardEntries.map((entry) => (
                <tr key={entry.user.id} className="border-t border-[var(--line)] bg-[var(--surface-strong)]">
                  <td className="px-4 py-3">#{entry.rank ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">
                    {entry.user.id === user.id
                      ? "You"
                      : entry.user.name ?? entry.user.email ?? "Player"}
                  </td>
                  <td className="px-4 py-3">{formatCoins(entry.balance)}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {entry.user.id === user.id ? "Current session" : "Leaderboard position"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

function formatLedgerLabel(type: string, reason: string) {
  if (type === "STARTER_GRANT") {
    return "Starter grant";
  }

  return reason;
}

function Stat({
  title,
  value,
  detail
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-4">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}
