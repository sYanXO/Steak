import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateMarketForm } from "@/components/admin/create-market-form";
import { CreateMatchForm } from "@/components/admin/create-match-form";
import { ManualTopUpForm } from "@/components/admin/manual-top-up-form";
import { MarketStatusForm } from "@/components/admin/market-status-form";
import { RecoveryRequestForm } from "@/components/admin/recovery-request-form";
import { SettleMarketForm } from "@/components/admin/settle-market-form";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCoins, formatUtcDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const [pendingMarkets, upcomingMatches, users, recentSettlements, recentTopUps, recoveryRequests, userCount, totalLedgerVolume] = await Promise.all([
    prisma.market.findMany({
      where: {
        OR: [{ status: "DRAFT" }, { status: "OPEN" }, { status: "CLOSED" }]
      },
      orderBy: [{ closesAt: "asc" }],
      take: 5,
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
    prisma.match.findMany({
      orderBy: [{ startsAt: "asc" }],
      take: 8,
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        startsAt: true
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
      take: 5,
      select: {
        id: true,
        reason: true,
        createdAt: true,
        admin: {
          select: { email: true, name: true }
        }
      }
    }),
    prisma.ledgerEntry.findMany({
      where: {
        type: "ADMIN_TOP_UP"
      },
      orderBy: { createdAt: "desc" },
      take: 5,
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
    prisma.accountRecoveryRequest.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 5,
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
    }),
    prisma.user.count(),
    prisma.ledgerEntry.aggregate({
      _sum: {
        amountDelta: true
      }
    })
  ]);

  return (
    <main className="app-shell py-8">
      <Card className="rounded-[32px] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Admin console
        </p>
        <h1 className="mt-2 text-3xl font-bold">Operational control surface</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
          Access is enforced on the server, and this view now reads live operational data
          from the database instead of static placeholders.
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-[32px] p-6 lg:col-span-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Pending actions
          </p>
          <div className="mt-4 space-y-3">
            {pendingMarkets.map((market) => (
              <div
                key={market.id}
                className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {market.match.homeTeam} vs {market.match.awayTeam}: {market.title}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {market._count.stakes} stakes tracked. Closes{" "}
                      {formatUtcDateTime(market.closesAt)}.
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    {market.status}
                  </span>
                </div>
                <SettleMarketForm
                  marketId={market.id}
                  outcomes={market.outcomes.map((outcome) => ({
                    id: outcome.id,
                    label: outcome.label
                  }))}
                />
                <MarketStatusForm marketId={market.id} currentStatus={market.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Platform totals</p>
          <p className="mt-3 text-3xl font-semibold">{formatCoins(userCount)}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Registered users in the system.</p>
          <div className="mt-5 rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
              Ledger volume
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCoins(totalLedgerVolume._sum.amountDelta ?? 0)}
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[32px] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Create match
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Add a fixture first so markets can be attached to a scheduled IPL match.
          </p>
          <div className="mt-5">
            <CreateMatchForm />
          </div>
        </Card>

        <Card className="rounded-[32px] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Create market
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Use comma-separated outcomes. Markets open immediately if the open time is in the past.
          </p>
          <div className="mt-5">
            <CreateMarketForm
              matches={upcomingMatches.map((match) => ({
                id: match.id,
                label: `${match.homeTeam} vs ${match.awayTeam} • ${formatUtcDateTime(match.startsAt)}`
              }))}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-6 rounded-[32px] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Manual balance top-up
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Credits a wallet and records both a ledger entry and an admin action log.
        </p>
        <div className="mt-5">
          <ManualTopUpForm
            users={users.map((user) => ({
              id: user.id,
              label: user.name ?? user.email ?? "User"
            }))}
          />
        </div>
      </Card>

      <Card className="mt-6 rounded-[32px] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Recovery requests
        </p>
        <div className="mt-4 space-y-3">
          {recoveryRequests.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No open recovery requests.</p>
          ) : (
            recoveryRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {request.user.name ?? request.user.email ?? "User"}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      Current: {request.currentEmail} • Requested: {request.requestedEmail}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{request.reason}</p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {formatUtcDateTime(request.createdAt)}
                  </p>
                </div>
                <RecoveryRequestForm
                  requestId={request.id}
                  requestedEmail={request.requestedEmail}
                />
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mt-6 rounded-[32px] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Recent settlements
        </p>
        <div className="mt-4 space-y-3">
          {recentSettlements.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No settlements have been recorded yet.</p>
          ) : (
            recentSettlements.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.reason}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {entry.admin.name ?? entry.admin.email ?? "Admin"}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{formatUtcDateTime(entry.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mt-6 rounded-[32px] p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Recent manual top-ups
        </p>
        <div className="mt-4 space-y-3">
          {recentTopUps.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No admin top-ups have been recorded yet.
            </p>
          ) : (
            recentTopUps.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {entry.wallet.user.name ?? entry.wallet.user.email ?? "User"}
                    </p>
                    <p className="text-sm text-[var(--muted)]">{entry.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--success)]">
                      +{formatCoins(entry.amountDelta)}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {formatUtcDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </main>
  );
}
