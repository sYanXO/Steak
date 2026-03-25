import { performance } from "node:perf_hooks";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runMarketAutomation } from "@/lib/services/market-automation";
import { settleMarketAutomatically } from "@/lib/services/settle-market";

const BENCH_PREFIX = "BENCHMARK";
const DEFAULT_AUTOMATION_MATCH_COUNT = 25;
const DEFAULT_SETTLEMENT_STAKE_COUNTS = [10, 50, 100];
const DEFAULT_STAKE_AMOUNT = 100;

type BenchmarkResult = {
  name: string;
  inputSize: number;
  durationMs: number;
  notes: string;
};

function nowStamp() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function cleanupBenchmarkData(runKey: string) {
  await prisma.match.deleteMany({
    where: {
      OR: [
        {
          title: {
            startsWith: `${BENCH_PREFIX}:${runKey}`
          }
        },
        {
          providerMatchId: {
            startsWith: `${BENCH_PREFIX}:${runKey}`
          }
        }
      ]
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: `${BENCH_PREFIX.toLowerCase()}-${runKey}-`
      }
    }
  });
}

async function seedAutomationMatches(runKey: string, count: number) {
  const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  for (let index = 0; index < count; index += 1) {
    await prisma.match.create({
      data: {
        provider: "BENCHMARK",
        providerMatchId: `${BENCH_PREFIX}:${runKey}:match:${index}`,
        title: `${BENCH_PREFIX}:${runKey}: Team ${index}A vs Team ${index}B`,
        homeTeam: `Bench Team ${index}A`,
        awayTeam: `Bench Team ${index}B`,
        startsAt: new Date(startsAt.getTime() + index * 60 * 60 * 1000),
        status: "SCHEDULED"
      }
    });
  }
}

async function benchmarkAutomation(runKey: string, matchCount: number): Promise<BenchmarkResult> {
  await seedAutomationMatches(runKey, matchCount);

  const started = performance.now();
  const summary = await runMarketAutomation(new Date());
  const durationMs = performance.now() - started;

  return {
    name: "automation-cycle",
    inputSize: matchCount,
    durationMs,
    notes: `created ${summary.createdMarketCount} markets, opened ${summary.openedMarketCount}, settled ${summary.settledMarketCount}`
  };
}

async function seedSettlementFixture(runKey: string, stakeCount: number) {
  const match = await prisma.match.create({
    data: {
      provider: "BENCHMARK",
      providerMatchId: `${BENCH_PREFIX}:${runKey}:settlement:${stakeCount}`,
      title: `${BENCH_PREFIX}:${runKey}: Settlement ${stakeCount}`,
      homeTeam: "Bench XI",
      awayTeam: "Load XI",
      startsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "LIVE"
    }
  });

  const market = await prisma.market.create({
    data: {
      matchId: match.id,
      type: "MATCH_WINNER",
      title: `${BENCH_PREFIX}:${runKey}: Match winner ${stakeCount}`,
      status: "OPEN",
      opensAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      closesAt: new Date(Date.now() - 60 * 1000),
      outcomes: {
        create: [
          {
            label: "Bench XI",
            order: 1,
            currentOdds: new Prisma.Decimal("2.0000"),
            totalStaked: 0
          },
          {
            label: "Load XI",
            order: 2,
            currentOdds: new Prisma.Decimal("2.0000"),
            totalStaked: 0
          }
        ]
      }
    },
    include: {
      outcomes: {
        orderBy: {
          order: "asc"
        }
      }
    }
  });

  const winningOutcome = market.outcomes[0];
  const losingOutcome = market.outcomes[1];

  if (!winningOutcome || !losingOutcome) {
    throw new Error("Benchmark market outcomes were not created.");
  }

  for (let index = 0; index < stakeCount; index += 1) {
    const email = `${BENCH_PREFIX.toLowerCase()}-${runKey}-${stakeCount}-${index}@stakeipl.app`;
    const user = await prisma.user.create({
      data: {
        email,
        name: `Benchmark User ${stakeCount}-${index}`,
        wallet: {
          create: {
            balance: 1000
          }
        }
      },
      include: {
        wallet: true
      }
    });

    if (!user.wallet) {
      throw new Error("Benchmark user wallet was not created.");
    }

    const selectedOutcome = index % 2 === 0 ? winningOutcome : losingOutcome;

    await prisma.stake.create({
      data: {
        userId: user.id,
        marketId: market.id,
        outcomeId: selectedOutcome.id,
        amount: DEFAULT_STAKE_AMOUNT,
        quotedOdds: new Prisma.Decimal("2.0000"),
        payoutBasis: new Prisma.Decimal("200.0000")
      }
    });
  }

  return {
    marketId: market.id,
    winningOutcomeId: winningOutcome.id
  };
}

async function benchmarkSettlement(
  runKey: string,
  stakeCount: number
): Promise<BenchmarkResult> {
  const fixture = await seedSettlementFixture(runKey, stakeCount);

  const started = performance.now();
  const summary = await settleMarketAutomatically({
    marketId: fixture.marketId,
    outcomeId: fixture.winningOutcomeId,
    actorId: null
  });
  const durationMs = performance.now() - started;

  return {
    name: "settlement-cycle",
    inputSize: stakeCount,
    durationMs,
    notes: `settled ${summary.settledStakeCount} pending stakes`
  };
}

async function main() {
  const runKey = nowStamp();
  const automationMatchCount = Number(
    process.env.BENCHMARK_AUTOMATION_MATCHES ?? DEFAULT_AUTOMATION_MATCH_COUNT
  );
  const settlementStakeCounts = String(
    process.env.BENCHMARK_SETTLEMENT_STAKES ?? DEFAULT_SETTLEMENT_STAKE_COUNTS.join(",")
  )
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  const results: BenchmarkResult[] = [];

  try {
    results.push(await benchmarkAutomation(runKey, automationMatchCount));

    for (const stakeCount of settlementStakeCounts) {
      results.push(await benchmarkSettlement(runKey, stakeCount));
    }

    console.log(
      JSON.stringify(
        {
          runKey,
          results: results.map((result) => ({
            ...result,
            durationMs: Number(result.durationMs.toFixed(2))
          }))
        },
        null,
        2
      )
    );
  } finally {
    await cleanupBenchmarkData(runKey);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
