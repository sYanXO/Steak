import { hash } from "bcryptjs";
import { PrismaClient, UserRole, LedgerEntryType, MatchStatus, MarketStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await hash("adminpass123", 10);
  const userPasswordHash = await hash("userpass123", 10);

  const [admin, user] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@stakeipl.app" },
      update: {},
      create: {
        email: "admin@stakeipl.app",
        name: "Admin User",
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
      where: { email: "captain@stakeipl.app" },
      update: {},
      create: {
        email: "captain@stakeipl.app",
        name: "Demo Player",
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
    where: { id: "seed-match-mi-csk" },
    update: {},
    create: {
      id: "seed-match-mi-csk",
      title: "Mumbai Indians vs Chennai Super Kings",
      homeTeam: "Mumbai Indians",
      awayTeam: "Chennai Super Kings",
      startsAt: new Date("2026-03-28T14:00:00.000Z"),
      status: MatchStatus.SCHEDULED
    }
  });

  await prisma.market.upsert({
    where: { id: "seed-market-mi-csk-winner" },
    update: {},
    create: {
      id: "seed-market-mi-csk-winner",
      matchId: match.id,
      type: "MATCH_WINNER",
      title: "Match winner",
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

  console.log({
    admin: admin.email,
    user: user.email
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
