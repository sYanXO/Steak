import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  recomputeAllGroupLeaderboards,
  recomputeGlobalLeaderboard
} from "@/lib/services/leaderboard";
import { signUpSchema } from "@/lib/validation/auth";

export const STARTER_BALANCE = 5000;

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export async function registerUser(rawInput: RegisterUserInput) {
  const input = signUpSchema.parse(rawInput);
  const passwordHash = await hash(input.password, 12);

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          wallet: {
            create: {
              balance: STARTER_BALANCE,
              entries: {
                create: {
                  type: "STARTER_GRANT",
                  amountDelta: STARTER_BALANCE,
                  balanceAfter: STARTER_BALANCE,
                  reason: "Starter coins"
                }
              }
            }
          }
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });

      await recomputeGlobalLeaderboard(tx);
      await recomputeAllGroupLeaderboards(tx);

      return user;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("An account already exists for that email.");
    }

    throw error;
  }
}
