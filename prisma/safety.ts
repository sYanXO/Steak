import type { SeedProfile } from "@/prisma/seed-profiles";

export function isLocalDatabaseUrl(databaseUrl = process.env.DATABASE_URL ?? "") {
  const normalized = databaseUrl.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return (
    normalized.startsWith("file:") ||
    normalized.includes("localhost") ||
    normalized.includes("127.0.0.1")
  );
}

export function assertDemoSeedAllowed(profile: SeedProfile, databaseUrl = process.env.DATABASE_URL) {
  if (profile === "production-safe") {
    return;
  }

  if (isLocalDatabaseUrl(databaseUrl)) {
    return;
  }

  if (process.env.ALLOW_REMOTE_DEMO_SEED === "true") {
    return;
  }

  throw new Error(
    `Refusing to run ${profile} seed against a non-local database. Set ALLOW_REMOTE_DEMO_SEED=true only if you intentionally want demo data on a shared or remote DB.`
  );
}

export function assertDestructiveDbCommandAllowed(
  commandName: string,
  databaseUrl = process.env.DATABASE_URL
) {
  if (isLocalDatabaseUrl(databaseUrl)) {
    return;
  }

  if (process.env.ALLOW_DESTRUCTIVE_DB_COMMANDS === "true") {
    return;
  }

  throw new Error(
    `Refusing to run ${commandName} against a non-local database. Set ALLOW_DESTRUCTIVE_DB_COMMANDS=true only when you intentionally accept destructive changes on a shared or remote DB.`
  );
}
