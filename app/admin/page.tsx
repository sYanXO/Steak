import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateMarketForm } from "@/components/admin/create-market-form";
import { CreateMatchForm } from "@/components/admin/create-match-form";
import { ManualTopUpForm } from "@/components/admin/manual-top-up-form";
import { MarketStatusForm } from "@/components/admin/market-status-form";
import { RecoveryRequestForm } from "@/components/admin/recovery-request-form";
import { SettleMarketForm } from "@/components/admin/settle-market-form";
import { UpdateMatchForm } from "@/components/admin/update-match-form";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getAdminPageData } from "@/lib/data/admin";
import { formatCoins, formatUtcDateTime } from "@/lib/format";
import { parsePageParam } from "@/lib/pagination";
import { getAdminRedirect } from "@/lib/page-state";

export const dynamic = "force-dynamic";

const ADMIN_SECTION_PAGE_SIZE = 5;

function parseSearchTerm(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function toDateTimeLocalValue(date: Date) {
  const offsetMillis = (5 * 60 + 30) * 60 * 1000;
  const shifted = new Date(date.getTime() + offsetMillis);

  return shifted.toISOString().slice(0, 16);
}

function toOptionalDateTimeLocalValue(date: Date | null) {
  return date ? toDateTimeLocalValue(date) : "";
}

function renderMatchStatusDetail(status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "ARCHIVED") {
  switch (status) {
    case "ARCHIVED":
      return "Archived matches are removed from active admin creation and management flows.";
    case "CANCELLED":
      return "Cancelled fixtures stay visible until archived so markets and audit history can be reviewed.";
    default:
      return null;
  }
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const pendingPage = parsePageParam(params.pendingPage);
  const matchesPage = parsePageParam(params.matchesPage);
  const recoveryPage = parsePageParam(params.recoveryPage);
  const settlementsPage = parsePageParam(params.settlementsPage);
  const topUpsPage = parsePageParam(params.topUpsPage);
  const searchTerm = parseSearchTerm(params.q);

  const redirectTarget = getAdminRedirect(session);

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  const {
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
    searchResults
  } = await getAdminPageData({
    pendingPage,
    matchesPage,
    recoveryPage,
    settlementsPage,
    topUpsPage,
    pageSize: ADMIN_SECTION_PAGE_SIZE,
    searchTerm
  });

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
        <form method="get" className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            name="q"
            defaultValue={searchTerm}
            placeholder="Search users, wallets, groups, markets, or matches"
            className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          />
          <button
            type="submit"
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-sm font-semibold"
          >
            Search admin
          </button>
          <Link
            href="/admin"
            className="rounded-2xl border border-[var(--line)] px-4 py-3 text-center text-sm font-semibold"
          >
            Clear
          </Link>
        </form>
      </Card>

      {searchResults.term ? (
        <Card className="mt-6 rounded-[32px] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Admin search</p>
          <h2 className="mt-2 text-2xl font-bold">Results for "{searchResults.term}"</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <SearchSection
              title="Users and wallets"
              emptyMessage="No users or wallet owners matched."
              items={searchResults.users.map((user) => ({
                id: user.id,
                title: user.name ?? user.email,
                detail: `${user.email} • ${user.role} • Balance ${formatCoins(user.wallet?.balance ?? 0)}`
              }))}
            />
            <SearchSection
              title="Groups"
              emptyMessage="No groups matched."
              items={searchResults.groups.map((group) => ({
                id: group.id,
                title: group.name,
                detail: `${group.slug} • ${group._count.members} member(s) • Owner ${group.owner.name ?? group.owner.email ?? "Unknown"}`
              }))}
            />
            <SearchSection
              title="Matches"
              emptyMessage="No matches matched."
              items={searchResults.matches.map((match) => ({
                id: match.id,
                title: `${match.homeTeam} vs ${match.awayTeam}`,
                detail: `${match.status} • ${match._count.markets} market(s) • Starts ${formatUtcDateTime(match.startsAt)}`
              }))}
            />
            <SearchSection
              title="Markets"
              emptyMessage="No markets matched."
              items={searchResults.markets.map((market) => ({
                id: market.id,
                title: market.title,
                detail: `${market.match.homeTeam} vs ${market.match.awayTeam} • ${market.status} • ${market._count.stakes} stake(s) • Closes ${formatUtcDateTime(market.closesAt)}`
              }))}
            />
          </div>
        </Card>
      ) : null}

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
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{
                      background:
                        market.status === "VOID" ? "var(--alert-error-bg)" : "var(--panel-strong)",
                      color:
                        market.status === "VOID" ? "var(--alert-error-text)" : "var(--foreground)"
                    }}
                  >
                    {market.status}
                  </span>
                </div>
                {market.status === "VOID" ? (
                  <p
                    className="mt-4 rounded-[20px] border px-4 py-3 text-sm"
                    style={{
                      borderColor: "var(--alert-error-border)",
                      background: "var(--alert-error-bg)",
                      color: "var(--alert-error-text)"
                    }}
                  >
                    This market has been voided. Pending stakes are refunded and settlement is disabled.
                  </p>
                ) : (
                  <SettleMarketForm
                    marketId={market.id}
                    outcomes={market.outcomes.map((outcome) => ({
                      id: outcome.id,
                      label: outcome.label
                    }))}
                  />
                )}
                <MarketStatusForm marketId={market.id} currentStatus={market.status} />
              </div>
            ))}
          </div>
          <PaginationControls
            pathname="/admin"
            page={pendingPage}
            pageParam="pendingPage"
            pageSize={ADMIN_SECTION_PAGE_SIZE}
            searchParams={params}
            totalCount={pendingMarketsCount}
          />
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
          Match management
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Update fixture details and lifecycle status without recreating attached markets.
        </p>
        <div className="mt-5 grid gap-4">
          {upcomingMatches.map((match) => (
            <div
              key={match.id}
              className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {match._count.markets} linked market(s). Starts {formatUtcDateTime(match.startsAt)}.
                  </p>
                </div>
                <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                  {match.status}
                </span>
              </div>
              {renderMatchStatusDetail(match.status) ? (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {renderMatchStatusDetail(match.status)}
                </p>
              ) : null}
              {match.tossWinner || match.winnerTeam ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {match.tossWinner ? `Toss: ${match.tossWinner}${match.tossDecision ? ` chose to ${match.tossDecision.toLowerCase()}` : ""}. ` : ""}
                  {match.winnerTeam ? `Winner: ${match.winnerTeam}.` : ""}
                </p>
              ) : null}
              <UpdateMatchForm
                match={{
                  id: match.id,
                  title: match.title,
                  homeTeam: match.homeTeam,
                  awayTeam: match.awayTeam,
                  startsAtLocalValue: toDateTimeLocalValue(match.startsAt),
                  tossWinner: match.tossWinner,
                  tossDecision: match.tossDecision,
                  winnerTeam: match.winnerTeam,
                  completedAtLocalValue: toOptionalDateTimeLocalValue(match.completedAt),
                  status: match.status
                }}
              />
            </div>
          ))}
        </div>
        <PaginationControls
          pathname="/admin"
          page={matchesPage}
          pageParam="matchesPage"
          pageSize={ADMIN_SECTION_PAGE_SIZE}
          searchParams={params}
          totalCount={upcomingMatchesCount}
        />
      </Card>

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
        <PaginationControls
          pathname="/admin"
          page={recoveryPage}
          pageParam="recoveryPage"
          pageSize={ADMIN_SECTION_PAGE_SIZE}
          searchParams={params}
          totalCount={recoveryRequestCount}
        />
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
        <PaginationControls
          pathname="/admin"
          page={settlementsPage}
          pageParam="settlementsPage"
          pageSize={ADMIN_SECTION_PAGE_SIZE}
          searchParams={params}
          totalCount={recentSettlementsCount}
        />
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
        <PaginationControls
          pathname="/admin"
          page={topUpsPage}
          pageParam="topUpsPage"
          pageSize={ADMIN_SECTION_PAGE_SIZE}
          searchParams={params}
          totalCount={recentTopUpsCount}
        />
      </Card>
    </main>
  );
}

function SearchSection({
  title,
  emptyMessage,
  items
}: {
  title: string;
  emptyMessage: string;
  items: Array<{
    id: string;
    title: string;
    detail: string;
  }>;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-soft)] p-5">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">{title}</p>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] p-4"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
