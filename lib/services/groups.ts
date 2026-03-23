import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  recomputeAllGroupLeaderboards,
  recomputeGlobalLeaderboard,
  recomputeGroupLeaderboard
} from "@/lib/services/leaderboard";
import { createGroupSchema, joinGroupSchema } from "@/lib/validation/group";

type GroupIdentity = {
  userEmail: string;
};

type CreateGroupInput = GroupIdentity & {
  name: string;
  slug: string;
};

type JoinGroupInput = GroupIdentity & {
  slug: string;
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

async function requireUser(tx: Prisma.TransactionClient, email: string) {
  const user = await tx.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { wallet: true }
  });

  if (!user?.wallet) {
    throw new Error("You need an active account before using groups.");
  }

  return user;
}

export async function createGroup(rawInput: CreateGroupInput) {
  const input = createGroupSchema.parse({
    ...rawInput,
    slug: normalizeSlug(rawInput.slug)
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await requireUser(tx, rawInput.userEmail);

      const group = await tx.group.create({
        data: {
          name: input.name,
          slug: input.slug,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id
            }
          }
        }
      });

      await recomputeGlobalLeaderboard(tx);
      await recomputeGroupLeaderboard(tx, group.id);

      return group;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("That group slug is already taken.");
    }

    throw error;
  }
}

export async function joinGroup(rawInput: JoinGroupInput) {
  const input = joinGroupSchema.parse({
    ...rawInput,
    slug: normalizeSlug(rawInput.slug)
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await requireUser(tx, rawInput.userEmail);
      const group = await tx.group.findUnique({
        where: { slug: input.slug }
      });

      if (!group) {
        throw new Error("Group not found.");
      }

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id
        }
      });

      await recomputeAllGroupLeaderboards(tx);

      return group;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("You are already a member of that group.");
    }

    throw error;
  }
}
