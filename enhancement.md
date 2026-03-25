# Recent Enhancements

## Admin Operations

- Added real market voiding support instead of a status-only toggle.
- Voiding a market now refunds all pending stakes to user wallets.
- Refunds write `SETTLEMENT_REVERSAL` ledger entries with admin attribution.
- Refunded stakes are marked `VOID` and timestamped as settled.
- Admin audit logs now capture refunded stake counts when a market is voided.
- Added admin search on `/admin` for users with wallet balances, groups, markets, and active matches.

## Match Management

- Added admin-side match editing from the `/admin` console.
- Admins can now update:
  - match title
  - home team
  - away team
  - match start time
  - match lifecycle status
- Added match archiving support so completed or cancelled fixtures can be removed from active admin workflows.
- Archiving is blocked while a match still has non-finalized markets attached.
- Added validation to block moving a match start time earlier than linked market close times.
- Match updates write `MATCH_UPDATED` audit logs with before/after metadata.

## Verification

- Added service-level test coverage for:
  - market void with refund behavior
  - match update behavior
  - match archive behavior
- Expanded browser e2e coverage to include admin-side match creation and market creation flows.
- Verified build passes after the new admin and refund flows.
- Verified TypeScript passes after admin search and match archive updates.

## UI Follow-Through

- Added explicit void-market warnings in the admin market status UI.
- Added refund feedback after a market is voided, including refunded stake count.
- Disabled settlement UI for markets that are already voided.
- Added clearer `VOID` status treatment in the admin console.
- Added recent stake visibility on the dashboard for settled and voided markets.
- Added refund messaging for voided user stakes on the dashboard.
- Added market-page messaging for voided and finalized markets so the staking UI does not appear misleadingly active.

## Pagination and Navigation

- Added reusable pagination controls for server-rendered pages.
- Added pagination to dashboard wallet activity, recent stakes, and leaderboard snapshot.
- Added pagination to admin pending markets, match management, recovery requests, recent settlements, and recent top-ups.
- Fixed authenticated navigation on the home page so logged-in users and admins can return to dashboard/admin after clicking the logo or Home.

## Cache and Performance

- Added shared cache tags for homepage, admin, market, and dashboard invalidation paths.
- Switched homepage cached reads to explicit tag-based invalidation support.
- Updated stake placement and admin mutations to invalidate targeted cache tags in addition to route paths.
- Added a short-lived cached admin overview data bundle to reduce repeat admin-page latency on back-and-forth navigation.
- Added a short-lived cached dashboard data bundle scoped per user to reduce repeat dashboard load time.
- Split market detail loading into cached public market data plus a smaller user-specific lookup to reduce repeat market-page latency.

## Observability

- Added a shared timing logger for server-side page data and mutation paths.
- Added structured timing logs for admin page data loading.
- Added structured timing logs for dashboard page data loading.
- Added structured timing logs for public market data loading.
- Added structured timing logs for stake placement transactions.

## Stability Follow-Up

- Hardened shared datetime formatting so cached string timestamps no longer crash dashboard or other pages expecting `Date` objects.

## Future Enhancements

- Lowest priority: evaluate Docker only if it starts solving a concrete operational problem such as onboarding friction, local environment parity issues, or a future need to run outside Vercel.
- Do not containerize the app in the current Vercel-managed setup; this is intentionally deferred to avoid overengineering.
- When CI/CD work is revisited, keep it minimal and focused on required PR checks rather than a heavy deployment pipeline.
- The first CI baseline should cover `npm ci`, `prisma generate`, `tsc --noEmit`, a CI-safe lint command, unit tests, and `next build`.
- Keep Vercel responsible for preview and production deployments instead of duplicating that behavior in a custom release system.
