# IPL Virtual Staking Platform Spec

## 1. Product Summary

This product is a public web platform for IPL match prediction using fictional in-app coins only. It is designed to simulate betting-style decision making and competition without involving real money, bank accounts, withdrawals, or prizes with monetary value.

Users sign up, receive a starting balance of virtual coins, place stakes on IPL markets with dynamic odds, compete on public and private leaderboards, and see their balances and rankings change based on manually settled results.

V1 is optimized for:

- Public signup
- Desktop-first usage
- Manual operations by admin
- Basic IPL markets only
- Social competition through leaderboards and groups

V1 explicitly does not include:

- Real-money deposits
- Withdrawals or cash redemption
- Tradeable rewards
- User-created markets
- Fantasy roster gameplay
- Native mobile apps
- Monetization

## 2. Product Principles

- Coins are fictional and platform-scoped. They have no cash value.
- The experience may feel like a realistic staking simulator, but nothing may connect to banking, payments, or redeemable rewards.
- Admin actions must be auditable.
- Wallet state must be ledger-backed, not balance-only.
- Admin protection must be enforced server-side.
- V1 should prefer operational simplicity over automation.

## 3. Core User Experience

### 3.1 Audience

- Primary audience: public users
- Secondary social mode: private groups for friend-based competition

### 3.2 Onboarding

- Anyone can sign up through open registration.
- Supported auth methods:
  - Email and password
  - Google sign-in
- Each new user receives `5000` starter coins once at account creation.

### 3.3 User Loop

1. User signs up or logs in.
2. User browses available IPL matches and open markets.
3. User places a stake using virtual coins.
4. Market closes before the relevant event starts.
5. Admin settles the market manually after the outcome is known.
6. User wallet balance and leaderboard position update.

### 3.4 Competition Surfaces

- Global public leaderboard
- Private group leaderboard
- User profile showing coin balance, history, and rank-related context

## 4. Hard Rules and Safety Boundaries

The product must enforce the following non-negotiable rules:

- No deposits of any kind
- No withdrawal flow
- No conversion from coins to money, gifts, merchandise, or redeemable value
- No payment gateway integration
- No purchase flow for extra coins
- No ad-based rewards tied to coin issuance in V1

V1 safety posture:

- Include light messaging that coins are fictional and non-redeemable.
- Do not position leaderboard success as financially meaningful.
- Do not include advanced responsible-play controls in V1 unless the spec is later revised.

## 5. V1 Functional Scope

### 5.1 Markets

V1 supports basic IPL markets only:

- Match winner
- Toss winner
- A small set of simple props

The implementation should keep the market catalog intentionally narrow in V1 to reduce settlement ambiguity and operational load.

V1 market pricing uses dynamic odds:

- Odds update automatically while a market is open as stake volume shifts across outcomes
- The pricing model should be simple and pool-based in V1 rather than admin-tuned or externally sourced
- Odds are informational and actionable at bet placement time; they are not manually edited by admins in normal V1 operation
- Manual admin action still applies to market lifecycle and settlement, not to live repricing

Out of scope:

- Broad player-prop catalogs
- User-generated markets
- Complex same-game combinations

### 5.2 Wallet and Balance Rules

- Starter balance: `5000` coins
- Starter balance is granted once on successful account creation
- Users spend coins when placing stakes
- Each accepted stake locks the quoted odds shown at placement time
- Settled outcomes return winnings or losses to the wallet according to the locked payout terms on each stake
- Admin may top up a user balance manually when needed
- Every balance-affecting event must create a ledger entry

### 5.3 Groups

- Users can create or join private groups
- Group members compete on a group-specific leaderboard
- Users can still appear on the public leaderboard while participating in private groups

### 5.4 Admin Operations

Admin console must support:

- Create matches
- Create markets under matches
- Open and close markets
- View user balances and activity summaries
- Settle markets manually
- Top up balances manually
- Review operational reports

## 6. Roles and Permissions

### 6.1 User Role

Standard users can:

- Register and authenticate
- View matches and markets
- Place stakes
- View wallet activity
- Join or manage their private groups, subject to future permission detail
- View public and private leaderboard standings they have access to

### 6.2 Admin Role

Admins can:

- Manage matches and markets
- Settle results
- Adjust balances via top-up
- Access reports and audit history

### 6.3 Admin Protection Requirements

Admin endpoints and admin-only workflows must be professionally protected:

- Role-based authorization enforced on the server
- No client-only protection
- Authenticated session required for all admin actions
- Audit logging for every admin balance change, settlement, market creation, market update, and market status change
- Clear separation between standard user routes and admin routes

## 7. Core Domain Model

The implementation must support at least these core entities:

### 7.1 User

- Identity
- Auth provider linkage
- Role
- Account status
- Profile metadata

### 7.2 Wallet

- Current virtual balance
- One-to-one relationship with user

### 7.3 LedgerEntry

- Wallet reference
- Entry type
- Amount delta
- Reason
- Related entity reference when applicable
- Actor reference for admin-triggered adjustments
- Timestamp

### 7.4 Match

- IPL fixture metadata
- Teams
- Match start time
- Status

### 7.5 Market

- Match reference
- Market type
- Status
- Open and close times
- Supported outcomes
- Current odds per outcome
- Aggregate stake totals per outcome
- Pricing model metadata
- Settlement state

### 7.6 Prediction or Stake

- User reference
- Market reference
- Selected outcome
- Stake amount
- Quoted odds at placement
- Locked payout basis
- Settlement result
- Payout amount

### 7.7 Group

- Group identity
- Owner or creator reference
- Membership
- Visibility and invite rules

### 7.8 LeaderboardEntry

- Ranking scope
- User reference
- Score and balance-derived metrics
- Time-bounded or season-bounded context if needed later

### 7.9 AdminActionLog

- Admin actor
- Action type
- Target entity
- Human-readable reason or context
- Timestamp

## 8. Key Flows

### 8.1 Registration

- User signs up with email/password or Google.
- System creates user account and wallet.
- System grants `5000` starter coins.
- System creates a ledger entry for the grant.

### 8.2 Place Stake

- User selects an open market.
- User chooses an outcome and stake amount.
- System validates market state and available balance.
- System calculates the current odds from the active market pool and quotes that price to the user.
- System records the stake.
- System stores the quoted odds and locked payout basis with the stake.
- System debits the wallet and creates a ledger entry.
- System updates the market pool totals and recalculates current odds for subsequent users.

### 8.3 Settle Market

- Admin enters the official outcome manually.
- System marks the market as settled.
- System computes payouts for all qualifying stakes using each winning stake's locked odds from placement time.
- System updates wallet balances and leaderboards.
- System writes all related ledger entries and admin audit logs.

### 8.4 Manual Balance Top-Up

- Admin selects a user.
- Admin enters top-up amount and reason.
- System validates permissions.
- System credits the wallet.
- System records the change in both the ledger and admin action log.

### 8.5 Group Participation

- User creates or joins a private group.
- Group leaderboard reflects only group members.
- Public leaderboard remains independent.

### 8.6 Dynamic Pricing Rules

- V1 uses a simple pool-based pricing model that reacts to how stake volume is distributed across outcomes.
- Odds change automatically after accepted stakes while the market remains open.
- Already placed stakes are never repriced after acceptance.
- Once a market is closed, no further stakes can be accepted and live odds stop changing.

## 9. Reporting and Admin Visibility

V1 admin reporting should be practical, not exhaustive. It should support:

- User count overview
- Wallet balance overview
- Recent settlements
- Recent manual top-ups
- Basic market activity summaries

Out of scope for V1:

- Advanced BI dashboards
- Fraud scoring systems
- Deep analytics pipelines

## 10. Technical Stack

### 10.1 Application Architecture

- Framework: `Next.js`
- App shape: full-stack single application
- Frontend and backend live in the same codebase
- Backend logic uses `Next.js` server routes and/or server actions
- Language: `TypeScript`

This choice is intended to keep V1 fast to build and easy to deploy while still supporting a protected admin surface.

### 10.2 Database

- Primary database: `Postgres`
- System of record for users, wallets, ledgers, matches, markets, stakes, groups, leaderboards, and admin logs

### 10.3 ORM

- ORM: `Prisma`

Prisma is the default access layer for relational modeling, migrations, and application queries.

### 10.4 Authentication

- Auth system: `Auth.js / NextAuth`
- Providers:
  - Credentials for email/password
  - Google OAuth

### 10.5 UI Stack

- Styling: `Tailwind CSS`
- Component system: `shadcn/ui`

This should be used for both the public-facing app and admin console unless there is a strong implementation reason to diverge later.

### 10.6 Validation

- Validation library: `Zod`

Zod schemas should be reused across forms, route handlers, and server actions where practical.

### 10.7 Hosting and Deployment

- Hosting target: `Vercel`
- Database: managed `Postgres`

The database provider may be chosen later, but the spec assumes a managed Postgres service compatible with Prisma and Vercel deployment.

### 10.8 Background Jobs

Use minimal cron-based scheduled tasks only where useful in V1, such as:

- Reminder-type notifications if added later
- Stale market checks
- Periodic leaderboard recomputation if needed

Do not introduce a queue system in V1 unless requirements expand.

## 11. Architectural Constraints

- The app should remain a single deployable web application in V1.
- Authorization must be enforced in backend code for all admin-only actions.
- Wallet updates must be transactional.
- Ledger integrity is more important than premature optimization.
- Manual settlement is the source of truth in V1.
- Dynamic pricing is internal platform logic; live bookmaker feeds and automated repricing from external sources are explicitly deferred.
- Live sports data integration is explicitly deferred.

## 12. Acceptance Criteria

The product spec should be considered implementable when the build can support these scenarios:

- A new user signs up and receives `5000` coins.
- A user can browse open IPL markets and place a stake using virtual coins.
- A user placing a stake receives the current quoted odds and that price is locked on the recorded stake.
- A user cannot place a stake if a market is closed or balance is insufficient.
- Later stakes can change displayed odds for the market without changing the locked payout terms of earlier stakes.
- An admin can create and settle markets from a protected admin interface.
- Settlements update wallet balances and leaderboard positions using each winning stake's locked odds.
- An admin can top up a user balance and the system records the reason and actor.
- A user can participate in both the global leaderboard and a private group leaderboard.
- A non-admin user is blocked from admin actions at the server level.

## 13. Out-of-Scope List

The following are intentionally out of scope for V1:

- Real-money economics
- Cash-like prizes
- Player-to-player transfers
- User-created markets
- Fantasy lineups
- Native apps
- Monetization
- Queue-based async processing
- Live sports data automation
- Admin-managed live odds editing
- Full responsible-gaming control suite

## 14. Future Extensions

Potential later additions, not part of V1:

- Data-provider integration for automated settlement
- Expanded market catalog
- Mobile-first redesign or native apps
- Advanced notifications
- Stronger safety controls
- Seasonal competitions and richer group management
- Monetization models that do not compromise the non-redeemable coin rule
