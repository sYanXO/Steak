/*
  Warnings:

  - The `status` column on the `AccountRecoveryRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RecoveryRequestStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "AdminActionType" ADD VALUE 'ACCOUNT_RECOVERY_RESOLVED';

-- AlterTable
ALTER TABLE "AccountRecoveryRequest" DROP COLUMN "status",
ADD COLUMN     "status" "RecoveryRequestStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "OutcomeOddsSnapshot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "oddsValue" DECIMAL(10,4) NOT NULL,
    "totalStaked" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutcomeOddsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutcomeOddsSnapshot_marketId_recordedAt_idx" ON "OutcomeOddsSnapshot"("marketId", "recordedAt");

-- CreateIndex
CREATE INDEX "OutcomeOddsSnapshot_outcomeId_recordedAt_idx" ON "OutcomeOddsSnapshot"("outcomeId", "recordedAt");

-- AddForeignKey
ALTER TABLE "OutcomeOddsSnapshot" ADD CONSTRAINT "OutcomeOddsSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutcomeOddsSnapshot" ADD CONSTRAINT "OutcomeOddsSnapshot_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "MarketOutcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
