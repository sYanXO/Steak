import Link from "next/link";
import { ShieldCheck, Trophy, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { LandingOddsChart } from "@/components/home/landing-odds-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHomepageData } from "@/lib/data/public";
import { formatCoins, formatOdds, formatUtcDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const { userCount, openMarkets, featuredMarket, totalStaked } = await getHomepageData();
  const isAuthenticated = Boolean(session?.user);

  const statCards = [
    {
      title: "Active players",
      value: formatCoins(userCount),
      detail: "Users with wallets and ledger-backed balances."
    },
    {
      title: "Open markets",
      value: formatCoins(openMarkets.length),
      detail: "Live match and toss markets accepting virtual stakes."
    },
    {
      title: "Pool volume",
      value: `${formatCoins(totalStaked)} coins`,
      detail: "Current aggregate market volume across outcomes."
    }
  ];

  return (
    <main className="pb-16 pt-8">
      <div className="app-shell">
        <header className="glass-panel rounded-[32px] px-6 py-5 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-dark)]">
                Virtual IPL staking
              </p>
              <h1
                className="mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Simulated markets, public leaderboards, zero real-money flows.
              </h1>
            </div>
            {!isAuthenticated ? (
              <LandingOddsChart market={featuredMarket ?? openMarkets[0] ?? null} />
            ) : null}
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {statCards.map((card) => (
            <Card key={card.title} className="rounded-[28px] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                {card.title}
              </p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{card.detail}</p>
            </Card>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="rounded-[32px] p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                  Open markets
                </p>
                <h2
                  className="mt-2 text-2xl font-bold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  V1 match and toss markets
                </h2>
              </div>
              <Trophy className="size-8 text-[var(--accent)]" />
            </div>
            <div className="mt-6 space-y-4">
              {openMarkets.map((market) => {
                const totalPool = market.outcomes.reduce(
                  (sum, outcome) => sum + outcome.totalStaked,
                  0
                );

                return (
                <div key={market.id} className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-[var(--muted)]">
                        {market.match.homeTeam} vs {market.match.awayTeam}
                      </p>
                      <h3 className="text-xl font-semibold">{market.title}</h3>
                    </div>
                    <div className="rounded-full bg-[var(--panel-strong)] px-4 py-2 text-sm font-medium">
                      Closes {formatUtcDateTime(new Date(market.closesAt))}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {market.outcomes.map((outcome) => (
                      <div
                        key={outcome.label}
                        className="rounded-[20px] border border-[var(--line)] bg-[var(--panel-strong)] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{outcome.label}</span>
                          <span className="text-sm text-[var(--muted)]">
                            {totalPool === 0
                              ? "0% of pool"
                              : `${Math.round((outcome.totalStaked / totalPool) * 100)}% of pool`}
                          </span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                          <span className="text-2xl font-semibold">{formatOdds(outcome.currentOdds)}</span>
                          <span className="text-sm text-[var(--muted)]">
                            {formatCoins(outcome.totalStaked)} staked
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button asChild variant="secondary">
                      <Link href={`/markets/${market.id}`}>View market</Link>
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[32px] p-6">
              <div className="flex items-center gap-3">
                <Wallet className="size-8 text-[var(--success)]" />
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                    Ledger-first wallet
                  </p>
                  <h2 className="text-2xl font-semibold">Starter balance: 5000 coins</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                Every balance change is backed by a ledger entry. Stakes debit the wallet
                immediately, winning settlements credit it later using the locked quote.
              </p>
            </Card>

            <Card className="rounded-[32px] p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-8 text-[var(--accent-dark)]" />
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                    Compliance boundary
                  </p>
                  <h2 className="text-2xl font-semibold">No deposits. No withdrawals.</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                Coins are fictional, non-redeemable, and scoped entirely to platform play.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
