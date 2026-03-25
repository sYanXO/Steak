# Recent Enhancements

## Admin Operations

- Added real market voiding support instead of a status-only toggle.
- Voiding a market now refunds all pending stakes to user wallets.
- Refunds write `SETTLEMENT_REVERSAL` ledger entries with admin attribution.
- Refunded stakes are marked `VOID` and timestamped as settled.
- Admin audit logs now capture refunded stake counts when a market is voided.

## Match Management

- Added admin-side match editing from the `/admin` console.
- Admins can now update:
  - match title
  - home team
  - away team
  - match start time
  - match lifecycle status
- Added validation to block moving a match start time earlier than linked market close times.
- Match updates write `MATCH_UPDATED` audit logs with before/after metadata.

## Verification

- Added service-level test coverage for:
  - market void with refund behavior
  - match update behavior
- Verified build passes after the new admin and refund flows.

## UI Follow-Through

- Added explicit void-market warnings in the admin market status UI.
- Added refund feedback after a market is voided, including refunded stake count.
- Disabled settlement UI for markets that are already voided.
- Added clearer `VOID` status treatment in the admin console.
- Added recent stake visibility on the dashboard for settled and voided markets.
- Added refund messaging for voided user stakes on the dashboard.
- Added market-page messaging for voided and finalized markets so the staking UI does not appear misleadingly active.
