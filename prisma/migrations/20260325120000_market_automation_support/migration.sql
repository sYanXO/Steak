ALTER TABLE "Match"
ADD COLUMN "tossWinner" TEXT,
ADD COLUMN "tossDecision" TEXT,
ADD COLUMN "winnerTeam" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3);

ALTER TABLE "Market"
ADD COLUMN "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "autoCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "automationKey" TEXT;

CREATE INDEX "Market_automationEnabled_status_opensAt_idx"
ON "Market"("automationEnabled", "status", "opensAt");

CREATE INDEX "Market_automationEnabled_status_closesAt_idx"
ON "Market"("automationEnabled", "status", "closesAt");

CREATE INDEX "Market_automationKey_status_idx"
ON "Market"("automationKey", "status");
