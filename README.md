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
AUTH_SECRET="replace-with-a-long-random-secret"
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

Before deploying the migration that adds partial unique indexes for open recovery requests and pending credential-change requests, audit the target database with:

```bash
set -a && source .env.local
npm run db:audit-request-constraints
```

If that command reports `safeToApplyConstraintMigration: true`, `prisma migrate deploy` should apply the new constraint migration without duplicate-row failures.

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
