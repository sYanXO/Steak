import { hash } from "bcryptjs";
import { LedgerEntryType, PrismaClient, UserRole } from "@prisma/client";
import {
  recomputeAllGroupLeaderboards,
  recomputeGlobalLeaderboard
} from "@/lib/services/leaderboard";

const prisma = new PrismaClient();
const STARTER_BALANCE = 5000;

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const email = readRequiredEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = readRequiredEnv("BOOTSTRAP_ADMIN_PASSWORD");
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Platform Admin";

  if (password.length < 8) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters long.");
  }

  const passwordHash = await hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email },
      include: { wallet: true }
    });

    let userId: string;
    let action: "created" | "promoted";

    if (existingUser) {
      const updatedUser = await tx.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          role: UserRole.ADMIN,
          passwordHash
        }
      });

      if (!existingUser.wallet) {
        await tx.wallet.create({
          data: {
            userId: updatedUser.id,
            balance: STARTER_BALANCE,
            entries: {
              create: {
                type: LedgerEntryType.STARTER_GRANT,
                amountDelta: STARTER_BALANCE,
                balanceAfter: STARTER_BALANCE,
                reason: "Starter coins"
              }
            }
          }
        });
      }

      userId = updatedUser.id;
      action = "promoted";
    } else {
      const createdUser = await tx.user.create({
        data: {
          email,
          name,
          role: UserRole.ADMIN,
          passwordHash,
          wallet: {
            create: {
              balance: STARTER_BALANCE,
              entries: {
                create: {
                  type: LedgerEntryType.STARTER_GRANT,
                  amountDelta: STARTER_BALANCE,
                  balanceAfter: STARTER_BALANCE,
                  reason: "Starter coins"
                }
              }
            }
          }
        }
      });

      userId = createdUser.id;
      action = "created";
    }

    await recomputeGlobalLeaderboard(tx);
    await recomputeAllGroupLeaderboards(tx);

    return { userId, action };
  });

  console.log(
    JSON.stringify(
      {
        email,
        name,
        role: "ADMIN",
        action: result.action,
        userId: result.userId
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
