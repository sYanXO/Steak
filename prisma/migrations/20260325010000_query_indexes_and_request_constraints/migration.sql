CREATE INDEX "LedgerEntry_walletId_createdAt_idx" ON "LedgerEntry"("walletId", "createdAt");
CREATE INDEX "LedgerEntry_type_createdAt_idx" ON "LedgerEntry"("type", "createdAt");

CREATE INDEX "Match_status_startsAt_idx" ON "Match"("status", "startsAt");

CREATE INDEX "Market_status_closesAt_idx" ON "Market"("status", "closesAt");
CREATE INDEX "Market_matchId_status_idx" ON "Market"("matchId", "status");

CREATE INDEX "Stake_marketId_result_idx" ON "Stake"("marketId", "result");
CREATE INDEX "Stake_userId_result_createdAt_idx" ON "Stake"("userId", "result", "createdAt");

CREATE INDEX "GroupMember_groupId_createdAt_idx" ON "GroupMember"("groupId", "createdAt");

CREATE INDEX "LeaderboardEntry_scope_rank_createdAt_idx" ON "LeaderboardEntry"("scope", "rank", "createdAt");
CREATE INDEX "LeaderboardEntry_groupId_scope_rank_idx" ON "LeaderboardEntry"("groupId", "scope", "rank");
CREATE INDEX "LeaderboardEntry_userId_scope_idx" ON "LeaderboardEntry"("userId", "scope");

CREATE INDEX "AdminActionLog_actionType_createdAt_idx" ON "AdminActionLog"("actionType", "createdAt");
CREATE INDEX "AdminActionLog_adminId_createdAt_idx" ON "AdminActionLog"("adminId", "createdAt");

CREATE INDEX "AccountRecoveryRequest_status_createdAt_idx" ON "AccountRecoveryRequest"("status", "createdAt");
CREATE INDEX "AccountRecoveryRequest_userId_status_idx" ON "AccountRecoveryRequest"("userId", "status");

CREATE INDEX "CredentialChangeRequest_userId_type_verifiedAt_idx" ON "CredentialChangeRequest"("userId", "type", "verifiedAt");
CREATE INDEX "CredentialChangeRequest_expiresAt_idx" ON "CredentialChangeRequest"("expiresAt");

CREATE UNIQUE INDEX "AccountRecoveryRequest_open_user_unique_idx"
ON "AccountRecoveryRequest"("userId")
WHERE "status" = 'OPEN';

CREATE UNIQUE INDEX "CredentialChangeRequest_open_user_type_unique_idx"
ON "CredentialChangeRequest"("userId", "type")
WHERE "verifiedAt" IS NULL;
