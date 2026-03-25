# Stake IPL

Stake IPL is a Next.js full-stack app for IPL prediction using fictional in-app coins only. It includes:

- public sign-up and credentials auth
- wallet provisioning with starter balance and ledger entries
- market browsing and stake placement with locked odds
- admin market creation, lifecycle control, settlement, and balance top-ups
- global and group leaderboards

## Stack

- `Next.js` app router
- `TypeScript`
- `Prisma`
- `Postgres` / `Neon`
- `Auth.js`
- `Tailwind CSS`

## Environment

Create [`.env.local`](/home/sreayan/stake-ipl/.env.local) with:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="replace-with-a-long-random-secret"
CRON_SECRET="replace-with-a-long-random-secret"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

Google auth is optional. If `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are blank, the UI hides the Google sign-in button.
OTP-backed self-service email/password changes require the SMTP env vars above.
`DIRECT_URL` should point at the direct database connection for Prisma migrations.
`CRON_SECRET` secures internal automation routes.

## Install

This workspace uses `nvm`. If `node` is not on your shell `PATH`, load it first:

```bash
source /home/sreayan/.nvm/nvm.sh
```

Install dependencies:

```bash
npm install
```

## Database workflows

Initial setup for a fresh database:

```bash
npm run db:setup
```

That will:

1. run the Prisma migration
2. seed the default `local-demo` profile with demo users and a starter market

Reset the database and reseed it:

```bash
npm run db:reset
```

Useful direct commands:

```bash
npm run prisma:migrate
npm run db:migrate:deploy
npm run prisma:seed
npm run prisma:seed:local-demo
npm run prisma:seed:staging
npm run prisma:seed:production-safe
npm run prisma:generate
npm run db:audit-request-constraints
npm run bootstrap:admin
```

## Seed profiles

`prisma/seed.ts` supports explicit seed profiles via `SEED_PROFILE`:

- `local-demo` (default): local admin + demo user + seeded match/market for development and e2e flows
- `staging-demo`: staging-scoped demo admin/user plus seeded match/market without reusing the local demo IDs
- `production-safe`: skips demo data and prints a reminder to use `npm run bootstrap:admin`

`npm run db:reset-demo` is local-profile specific and expects the default `local-demo` seed data.

If `DATABASE_URL` points to a non-local database and `SEED_PROFILE` is not set, seeding now defaults to `production-safe`.

Before deploying the migration that adds partial unique indexes for open recovery requests and pending credential-change requests, audit the target database with:

```bash
set -a && source .env.local
npm run db:audit-request-constraints
```

If that command reports `safeToApplyConstraintMigration: true`, `prisma migrate deploy` should apply the new constraint migration without duplicate-row failures.

## Shared DB Safety

If your local environment points at the same remote database as Vercel, treat that database as production.

Protected commands:

- `npm run db:setup`
- `npm run db:reset`
- `npm run db:reset-demo`
- `npm run prisma:migrate`

Those commands now refuse to run against non-local databases unless you explicitly opt in.

For a shared or production database, prefer:

```bash
source /home/sreayan/.nvm/nvm.sh
set -a && source .env.local
npm run db:audit-request-constraints
npm run db:migrate:deploy
```

Escape hatches:

- `ALLOW_DESTRUCTIVE_DB_COMMANDS=true`: allows destructive local-dev style DB commands against a remote DB
- `ALLOW_REMOTE_DEMO_SEED=true`: allows demo seed profiles against a remote DB

Do not use either escape hatch unless you intentionally want to mutate a shared or production database.

Use the shared-database deploy sequence above as the canonical safe migration and deployment flow.

## Demo accounts

Seeded credentials for the default `local-demo` profile:

- admin: `admin@stakeipl.app` / `adminpass123`
- user: `captain@stakeipl.app` / `userpass123`

The seed also creates one demo IPL market.

The `staging-demo` profile seeds:

- admin: `staging-admin@stakeipl.app` / `adminpass123`
- user: `staging-player@stakeipl.app` / `userpass123`

## Admin bootstrap

For a fresh deployed database where you do not want demo seed data, create the first admin with:

```bash
source /home/sreayan/.nvm/nvm.sh
set -a && source .env.local
BOOTSTRAP_ADMIN_EMAIL="you@example.com" \
BOOTSTRAP_ADMIN_PASSWORD="replace-with-a-strong-password" \
BOOTSTRAP_ADMIN_NAME="Your Name" \
npm run bootstrap:admin
```

This script is idempotent:

- if the user does not exist, it creates an admin account with a wallet
- if the user already exists, it promotes that user to `ADMIN`, updates the password, and ensures a wallet exists

## Run

Start the app locally:

```bash
npm run dev
```

Production validation:

```bash
npm run build
npx next typegen && npx tsc --noEmit
```

## Automated market workflow

The app now supports a cron-safe automation route at `/api/cron/market-automation`.

Use it to:

- auto-create default `MATCH_WINNER` and `TOSS_WINNER` markets for scheduled/live matches
- open automated markets when `opensAt` passes
- close automated markets when `closesAt` passes
- auto-settle toss and match-winner markets once the corresponding result is recorded on the match

Protect the route with `CRON_SECRET` and call it with either:

- `Authorization: Bearer <CRON_SECRET>`
- `x-cron-secret: <CRON_SECRET>`

To make auto-settlement work, record the official toss and match result fields from the admin match-management form.

## Current product surface

- `sign-up`: creates the user, wallet, and starter ledger entry transactionally
- `dashboard`: wallet activity, open stakes, global rank, group summaries
- `markets/[marketId]`: live market detail and stake placement
- `admin`: match creation, market creation, status changes, settlement, top-ups
- `groups`: create/join group and view group leaderboard

## Notes

- Coins are fictional and non-redeemable.
- Leaderboards are persisted in `LeaderboardEntry` and recomputed whenever balances change.
- The current repository contains live verification data created during development in the connected Neon database.
