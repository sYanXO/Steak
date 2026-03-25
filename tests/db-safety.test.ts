import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDemoSeedAllowed,
  assertDestructiveDbCommandAllowed,
  isLocalDatabaseUrl
} from "@/prisma/safety";
import { resolveSeedProfile } from "@/prisma/seed-profiles";

test("isLocalDatabaseUrl detects local database urls", () => {
  assert.equal(isLocalDatabaseUrl("postgresql://user:pass@localhost:5432/app"), true);
  assert.equal(isLocalDatabaseUrl("postgresql://user:pass@127.0.0.1:5432/app"), true);
  assert.equal(isLocalDatabaseUrl("file:./dev.db"), true);
  assert.equal(isLocalDatabaseUrl("postgresql://user:pass@ep-prod.neon.tech/db"), false);
});

test("resolveSeedProfile defaults safely on remote databases", () => {
  assert.equal(
    resolveSeedProfile(undefined, "postgresql://user:pass@ep-prod.neon.tech/db"),
    "production-safe"
  );
  assert.equal(
    resolveSeedProfile(undefined, "postgresql://user:pass@localhost:5432/app"),
    "local-demo"
  );
});

test("assertDemoSeedAllowed rejects remote demo seeding by default", () => {
  const previous = process.env.ALLOW_REMOTE_DEMO_SEED;
  delete process.env.ALLOW_REMOTE_DEMO_SEED;

  assert.throws(
    () => assertDemoSeedAllowed("local-demo", "postgresql://user:pass@ep-prod.neon.tech/db"),
    /Refusing to run local-demo seed/
  );

  process.env.ALLOW_REMOTE_DEMO_SEED = "true";

  assert.doesNotThrow(() =>
    assertDemoSeedAllowed("staging-demo", "postgresql://user:pass@ep-prod.neon.tech/db")
  );

  if (previous === undefined) {
    delete process.env.ALLOW_REMOTE_DEMO_SEED;
  } else {
    process.env.ALLOW_REMOTE_DEMO_SEED = previous;
  }
});

test("assertDestructiveDbCommandAllowed rejects remote destructive commands by default", () => {
  const previous = process.env.ALLOW_DESTRUCTIVE_DB_COMMANDS;
  delete process.env.ALLOW_DESTRUCTIVE_DB_COMMANDS;

  assert.throws(
    () => assertDestructiveDbCommandAllowed("db:reset", "postgresql://user:pass@ep-prod.neon.tech/db"),
    /Refusing to run db:reset/
  );

  assert.doesNotThrow(() =>
    assertDestructiveDbCommandAllowed("db:reset", "postgresql://user:pass@localhost:5432/app")
  );

  process.env.ALLOW_DESTRUCTIVE_DB_COMMANDS = "true";

  assert.doesNotThrow(() =>
    assertDestructiveDbCommandAllowed("db:reset", "postgresql://user:pass@ep-prod.neon.tech/db")
  );

  if (previous === undefined) {
    delete process.env.ALLOW_DESTRUCTIVE_DB_COMMANDS;
  } else {
    process.env.ALLOW_DESTRUCTIVE_DB_COMMANDS = previous;
  }
});
