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
```

Google auth is optional. If `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are blank, the UI hides the Google sign-in button.

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
2. seed demo users and a starter market

Reset the database and reseed it:

```bash
npm run db:reset
```

Useful direct commands:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run prisma:generate
npm run bootstrap:admin
```

## Demo accounts

Seeded credentials:

- admin: `admin@stakeipl.app` / `adminpass123`
- user: `captain@stakeipl.app` / `userpass123`

The seed also creates one demo IPL market.

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
