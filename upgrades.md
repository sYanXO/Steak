# Upcoming Upgrades

This file tracks the next planned product and platform upgrades for `stake-ipl`.

## Immediate Priorities

- Finish profile and account management flows.
  - Replace the current "under development" placeholders on `/profile` with real self-service email and password update flows where appropriate.
  - Keep admin-safe recovery paths intact.

- Expand observability beyond local structured logs.
  - Add external error capture and alerting for auth, admin mutations, profile actions, and stake placement.

- Reduce public-route session and middleware overhead.
  - Avoid unnecessary auth/session work on public pages where it is not required.

- Profile Neon round trips and collapse avoidable queries.
  - Review the hottest dashboard, admin, and market reads for duplicate or overly chatty database access.

## Product Features

- Add scheduled market opening and automatic closure based on match lifecycle.
- Add a market result review flow before final settlement.
- Add richer market types:
  - top batter
  - top bowler
  - player milestones
  - over-by-over specials
  - tournament futures
- Add private/public groups, invite codes, and owner/admin group controls.
- Add notifications for market close, settlement, and rank movement.

## UX Improvements

- Add broader success and error feedback for major actions.
- Improve mobile layout density for admin screens, tables, and market cards.
- Continue dark-mode polish for stronger hierarchy and table contrast.
- Expand the market detail experience with recent activity, implied probabilities, and clearer odds movement history.

## Platform and Infra

- Upgrade the current in-memory limiter to a shared distributed store when multi-instance consistency matters.
- Upgrade the current process-local idempotency guard to a shared persistent store when cross-instance duplicate protection becomes necessary.
- Add browser-level e2e coverage once the local and CI browser environment is stable.
- Keep CI/CD minimal when revisited:
  - install
  - Prisma generate
  - typecheck
  - lint
  - tests
  - production build

## Deferred

- Evaluate Docker only if it solves a concrete operational problem such as onboarding friction, local environment parity, or a future need to run outside Vercel.
