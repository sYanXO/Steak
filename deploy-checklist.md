# Deploy Checklist

This project currently uses one shared remote database for both local work and Vercel.
Treat that database as production.

## Before pushing schema changes

1. Load the project environment:

```bash
source /home/sreayan/.nvm/nvm.sh
set -a && source .env.local
```

2. Regenerate Prisma client if `prisma/schema.prisma` changed:

```bash
npx prisma generate
```

3. Run the request-constraint audit before migrations that add or tighten uniqueness:

```bash
npm run db:audit-request-constraints
```

4. Confirm the audit output says:

```json
"safeToApplyConstraintMigration": true
```

## Safe deploy flow

1. Apply committed migrations to the shared database:

```bash
npm run db:migrate:deploy
```

2. Push the code.

3. Redeploy on Vercel.

## Do not run against the shared database

- `npm run db:setup`
- `npm run db:reset`
- `npm run db:reset-demo`
- `npm run prisma:migrate`
- demo seed profiles unless you explicitly intend to add demo data remotely

These commands are now guarded and will refuse to run unless you explicitly override the safety checks.

## If the deploy breaks

1. Roll back the app code first by redeploying the previous known-good commit in Vercel.
2. Do not run destructive database commands as a first response.
3. Check whether the failure is:
   - app-code only
   - migration-related
   - environment-variable related
4. If the failure happened after migrations were already applied, prefer fixing forward with a new commit instead of trying to reset the shared database.

## Escape hatches

These are intentionally dangerous:

- `ALLOW_DESTRUCTIVE_DB_COMMANDS=true`
- `ALLOW_REMOTE_DEMO_SEED=true`

Do not set them unless you explicitly want to mutate the shared remote database in a non-standard way.
