-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "lastEmailChangeAt" TIMESTAMP(3),
ADD COLUMN     "lastPasswordChangeAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AccountRecoveryRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentEmail" TEXT NOT NULL,
    "requestedEmail" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountRecoveryRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AccountRecoveryRequest" ADD CONSTRAINT "AccountRecoveryRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
