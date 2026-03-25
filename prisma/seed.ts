import { hash } from "bcryptjs";
import { PrismaClient, UserRole, LedgerEntryType, MatchStatus, MarketStatus } from "@prisma/client";
import { getDemoSeedConfig, resolveSeedProfile } from "@/prisma/seed-profiles";

const prisma = new PrismaClient();

async function main() {
  const profile = resolveSeedProfile();

  if (profile === "production-safe") {
    console.log(
      JSON.stringify(
        {
          profile,
          seeded: false,
          message:
            "Production-safe seed profile skips demo data. Run npm run bootstrap:admin to create the first admin."
        },
        null,
        2
      )
    );
    return;
  }

  const config = getDemoSeedConfig(profile);
  const adminPasswordHash = await hash(config.admin.password, 10);
  const userPasswordHash = await hash(config.user.password, 10);

  const [admin, user] = await Promise.all([
    prisma.user.upsert({
      where: { email: config.admin.email },
      update: {},
      create: {
        email: config.admin.email,
        name: config.admin.name,
        role: UserRole.ADMIN,
        passwordHash: adminPasswordHash,
        wallet: {
          create: {
            balance: 5000,
            entries: {
              create: {
                type: LedgerEntryType.STARTER_GRANT,
                amountDelta: 5000,
                balanceAfter: 5000,
                reason: "Starter coins"
              }
            }
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: config.user.email },
      update: {},
      create: {
        email: config.user.email,
        name: config.user.name,
        passwordHash: userPasswordHash,
        wallet: {
          create: {
            balance: 5000,
            entries: {
              create: {
                type: LedgerEntryType.STARTER_GRANT,
                amountDelta: 5000,
                balanceAfter: 5000,
                reason: "Starter coins"
              }
            }
          }
        }
      }
    })
  ]);

  const match = await prisma.match.upsert({
    where: { id: config.match.id },
    update: {},
    create: {
      id: config.match.id,
      title: config.match.title,
      homeTeam: config.match.homeTeam,
      awayTeam: config.match.awayTeam,
      startsAt: new Date("2026-03-28T14:00:00.000Z"),
      status: MatchStatus.SCHEDULED
    }
  });

  await prisma.market.upsert({
    where: { id: config.market.id },
    update: {},
    create: {
      id: config.market.id,
      matchId: match.id,
      type: config.market.type,
      title: config.market.title,
      status: MarketStatus.OPEN,
      opensAt: new Date("2026-03-23T08:00:00.000Z"),
      closesAt: new Date("2026-03-28T13:55:00.000Z"),
      pricingMetadata: { model: "pool-based", seed: true },
      outcomes: {
        create: [
          { label: "Mumbai Indians", order: 1, currentOdds: 1.82, totalStaked: 12400 },
          { label: "Chennai Super Kings", order: 2, currentOdds: 2.17, totalStaked: 10100 }
        ]
      }
    }
  });

  const seedOutcomes = await prisma.marketOutcome.findMany({
    where: { marketId: config.market.id },
    orderBy: { order: "asc" }
  });

  if (seedOutcomes.length === 2) {
    await prisma.outcomeOddsSnapshot.deleteMany({
      where: { marketId: config.market.id }
    });

    const timeline = [
      { offsetMinutes: 0, odds: [2.08, 1.96] },
      { offsetMinutes: 15, odds: [2.02, 2.01] },
      { offsetMinutes: 30, odds: [1.95, 2.08] },
      { offsetMinutes: 45, odds: [1.9, 2.12] },
      { offsetMinutes: 60, odds: [1.86, 2.15] },
      { offsetMinutes: 75, odds: [1.82, 2.17] }
    ] as const;
    const baseRecordedAt = new Date("2026-03-24T12:30:00.000Z");

    await prisma.outcomeOddsSnapshot.createMany({
      data: timeline.flatMap((point) =>
        seedOutcomes.map((outcome, index) => ({
          marketId: config.market.id,
          outcomeId: outcome.id,
          oddsValue: point.odds[index],
          totalStaked: index === 0 ? 12400 : 10100,
          recordedAt: new Date(baseRecordedAt.getTime() + point.offsetMinutes * 60_000)
        }))
      )
    });
  }

  console.log({
    profile,
    admin: admin.email,
    user: user.email,
    marketId: config.market.id
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
