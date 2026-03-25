ALTER TABLE "Match"
ADD COLUMN "provider" TEXT,
ADD COLUMN "providerMatchId" TEXT,
ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Match_providerMatchId_key"
ON "Match"("providerMatchId");

CREATE INDEX "Match_provider_startsAt_idx"
ON "Match"("provider", "startsAt");
