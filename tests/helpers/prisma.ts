import { afterEach } from "node:test";
import { prisma } from "@/lib/prisma";

const restores: Array<() => void> = [];

export function mockPrismaTransaction(tx: unknown) {
  const original = prisma.$transaction;

  (prisma as typeof prisma & {
    $transaction: typeof prisma.$transaction;
  }).$transaction = (async (callback: (input: unknown) => Promise<unknown>) =>
    callback(tx)) as typeof prisma.$transaction;

  const restore = () => {
    (prisma as typeof prisma & {
      $transaction: typeof prisma.$transaction;
    }).$transaction = original;
  };

  restores.push(restore);
  return restore;
}

afterEach(() => {
  while (restores.length > 0) {
    const restore = restores.pop();
    restore?.();
  }
});
