import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { StakeForm } from "@/components/markets/stake-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCoins, formatOdds, formatUtcDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({
  params
}: {
  params: Promise<{ marketId: string }>;
}) {
  const { marketId } = await params;
  const session = await auth();
  const [market, viewer] = await Promise.all([
    prisma.market.findUnique({
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
    }),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            wallet: {
              select: {
                balance: true
              }
            },
            stakes: {
              where: { marketId },
              take: 1,
              select: {
                amount: true,
                quotedOdds: true,
                outcome: {
                  select: {
                    label: true
                  }
                }
              }
            }
          }
        })
      : Promise.resolve(null)
  ]);

  if (!market) {
    notFound();
  }

  const totalPool = market.outcomes.reduce((sum, outcome) => sum + outcome.totalStaked, 0);

  const viewerStake = viewer?.stakes[0] ?? null;
  const marketIsUnavailable = market.status === "VOID" || market.status === "SETTLED";

  return (
    <main className="app-shell py-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <Card className="rounded-[32px] p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            {market.match.homeTeam} vs {market.match.awayTeam}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{market.title}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Match starts {formatUtcDateTime(market.match.startsAt)}. Market closes{" "}
            {formatUtcDateTime(market.closesAt)}.
          </p>
          {market.status === "VOID" ? (
            <p
              className="mt-4 rounded-[20px] border px-4 py-3 text-sm"
              style={{
                borderColor: "var(--alert-error-border)",
                background: "var(--alert-error-bg)",
                color: "var(--alert-error-text)"
              }}
            >
              This market was voided. Pending stakes were refunded and no settlement result will be recorded.
            </p>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {market.outcomes.map((outcome) => (
              <div
                key={outcome.id}
                className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{outcome.label}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {totalPool === 0
                      ? "0% of pool"
                      : `${Math.round((outcome.totalStaked / totalPool) * 100)}% of pool`}
                  </p>
                </div>
                <p className="mt-4 text-3xl font-bold">{formatOdds(Number(outcome.currentOdds))}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {formatCoins(outcome.totalStaked)} coins already staked
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[32px] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Market totals</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <Metric label="Open stakes" value={formatCoins(market._count.stakes)} />
              <Metric label="Pool volume" value={`${formatCoins(totalPool)} coins`} />
              <Metric label="Status" value={market.status} />
            </div>
          </Card>

          <Card className="rounded-[32px] p-6">
            {viewer?.wallet ? (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                  Available balance
                </p>
                <p className="mt-2 text-3xl font-semibold">{formatCoins(viewer.wallet.balance)}</p>
                {viewerStake ? (
                  <>
                    <p className="mt-5 text-sm text-[var(--muted)]">
                      You already have a locked position in this market.
                    </p>
                    <div className="mt-4 rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                      <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                        Your stake
                      </p>
                      <p className="mt-2 text-xl font-semibold">{viewerStake.outcome.label}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {formatCoins(viewerStake.amount)} coins at{" "}
                        {formatOdds(Number(viewerStake.quotedOdds))}
                      </p>
                    </div>
                  </>
                ) : marketIsUnavailable ? (
                  <p className="mt-5 rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">
                    {market.status === "VOID"
                      ? "This market is voided and no further stakes can be placed."
                      : "This market has already been finalized."}
                  </p>
                ) : (
                  <>
                    <p className="mt-5 text-sm text-[var(--muted)]">
                      Your stake locks the displayed odds at placement time.
                    </p>
                    <div className="mt-5">
                      <StakeForm
                        marketId={market.id}
                        outcomes={market.outcomes.map((outcome) => ({
                          id: outcome.id,
                          label: outcome.label,
                          odds: formatOdds(Number(outcome.currentOdds)),
                          totalStaked: `${formatCoins(outcome.totalStaked)} coins`
                        }))}
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                  Sign in required
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Authenticate to place a stake</h2>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Stake placement debits your wallet immediately and creates a ledger entry.
                </p>
                <div className="mt-5 flex gap-3">
                  <Button asChild>
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/sign-up">Create account</Link>
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
