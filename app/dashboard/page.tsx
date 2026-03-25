import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getDashboardPageDataCached } from "@/lib/data/dashboard";
import { formatCoins, formatOdds, formatRelativeDelta, formatUtcDateTime } from "@/lib/format";
import { parsePageParam } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const WALLET_PAGE_SIZE = 5;
const STAKES_PAGE_SIZE = 5;
const LEADERBOARD_PAGE_SIZE = 10;

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const walletPage = parsePageParam(params.walletPage);
  const stakesPage = parsePageParam(params.stakesPage);
  const leaderboardPage = parsePageParam(params.leaderboardPage);

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  const dashboardData = await getDashboardPageDataCached({
    userId: session.user.id,
    walletPage,
    stakesPage,
    leaderboardPage,
    walletPageSize: WALLET_PAGE_SIZE,
    stakesPageSize: STAKES_PAGE_SIZE,
    leaderboardPageSize: LEADERBOARD_PAGE_SIZE
  });

  if (!dashboardData?.user?.wallet) {
    redirect("/sign-in");
  }

  const {
    user,
    pendingStakeCount,
    totalStakeCount,
    totalWalletEntryCount,
    leaderboardEntries,
    totalLeaderboardCount
  } = dashboardData;
  const wallet = user.wallet!;
  const userRank = user.leaderboard[0]?.rank ?? null;

  return (
    <main className="app-shell py-8">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
        <Card className="rounded-[32px] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                Personal dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                Welcome back, {user.name ?? user.email.split("@")[0]}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
                Your account is active, ledger-backed, and ready for the next market move.
              </p>
            </div>
            <Button asChild variant="secondary" className="md:mt-1">
              <Link href="/profile">My profile</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Stat
              title="Balance"
              value={formatCoins(wallet.balance)}
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
          {wallet.entries.map((entry) => (
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
          <PaginationControls
            pathname="/dashboard"
            page={walletPage}
            pageParam="walletPage"
            pageSize={WALLET_PAGE_SIZE}
            searchParams={params}
            totalCount={totalWalletEntryCount}
          />
        </Card>
      </div>

      <Card className="mt-6 rounded-[32px] p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Recent stakes
          </p>
          <span className="text-sm text-[var(--muted)]">Includes settled and voided markets</span>
        </div>
        <div className="mt-4 space-y-3">
          {user.stakes.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No stakes placed yet.</p>
          ) : (
            user.stakes.map((stake) => (
              <div
                key={stake.id}
                className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">
                      {stake.market.title}: {stake.outcome.label}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatCoins(stake.amount)} coins at {formatOdds(Number(stake.quotedOdds))}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={statusPillStyle(stake.result)}
                  >
                    {stake.result}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {stake.result === "VOID"
                    ? `Refunded ${formatCoins(stake.payoutAmount)} coins${
                        stake.settledAt ? ` on ${formatUtcDateTime(stake.settledAt)}` : ""
                      }.`
                    : stake.settledAt
                      ? `Resolved ${formatUtcDateTime(stake.settledAt)}.`
                      : "Awaiting market settlement."}
                </p>
              </div>
            ))
          )}
        </div>
        <PaginationControls
          pathname="/dashboard"
          page={stakesPage}
          pageParam="stakesPage"
          pageSize={STAKES_PAGE_SIZE}
          searchParams={params}
          totalCount={totalStakeCount}
        />
      </Card>

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
        <PaginationControls
          pathname="/dashboard"
          page={leaderboardPage}
          pageParam="leaderboardPage"
          pageSize={LEADERBOARD_PAGE_SIZE}
          searchParams={params}
          totalCount={totalLeaderboardCount}
        />
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

function statusPillStyle(result: "PENDING" | "WON" | "LOST" | "VOID") {
  if (result === "WON") {
    return {
      background: "var(--alert-success-bg)",
      color: "var(--alert-success-text)"
    };
  }

  if (result === "VOID") {
    return {
      background: "var(--alert-error-bg)",
      color: "var(--alert-error-text)"
    };
  }

  return {
    background: "var(--panel-strong)",
    color: "var(--foreground)"
  };
}
