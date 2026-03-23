import type { Prisma } from "@prisma/client";

export async function recomputeGlobalLeaderboard(tx: Prisma.TransactionClient) {
  const wallets = await tx.wallet.findMany({
    orderBy: [{ balance: "desc" }, { createdAt: "asc" }]
  });

  await tx.leaderboardEntry.deleteMany({
    where: { scope: "GLOBAL" }
  });

  if (wallets.length === 0) {
    return;
  }

  await tx.leaderboardEntry.createMany({
    data: wallets.map((wallet, index) => ({
      scope: "GLOBAL",
      userId: wallet.userId,
      rank: index + 1,
      score: wallet.balance,
      balance: wallet.balance
    }))
  });
}

export async function recomputeGroupLeaderboard(
  tx: Prisma.TransactionClient,
  groupId: string
) {
  const members = await tx.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        include: {
          wallet: true
        }
      }
    },
    orderBy: [{ createdAt: "asc" }]
  });

  await tx.leaderboardEntry.deleteMany({
    where: {
      scope: "GROUP",
      groupId
    }
  });

  const rankedMembers = members
    .filter((member) => member.user.wallet)
    .sort((a, b) => {
      const balanceDelta = (b.user.wallet?.balance ?? 0) - (a.user.wallet?.balance ?? 0);

      if (balanceDelta !== 0) {
        return balanceDelta;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  if (rankedMembers.length === 0) {
    return;
  }

  await tx.leaderboardEntry.createMany({
    data: rankedMembers.map((member, index) => ({
      scope: "GROUP",
      userId: member.userId,
      groupId,
      rank: index + 1,
      score: member.user.wallet?.balance ?? 0,
      balance: member.user.wallet?.balance ?? 0
    }))
  });
}

export async function recomputeAllGroupLeaderboards(tx: Prisma.TransactionClient) {
  const groups = await tx.group.findMany({
    select: { id: true }
  });

  for (const group of groups) {
    await recomputeGroupLeaderboard(tx, group.id);
  }
}
