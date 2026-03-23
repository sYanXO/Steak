-- CreateEnum
CREATE TYPE "CredentialChangeType" AS ENUM ('EMAIL', 'PASSWORD');

-- CreateTable
CREATE TABLE "CredentialChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CredentialChangeType" NOT NULL,
    "targetEmail" TEXT,
    "passwordHash" TEXT,
    "otpCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialChangeRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CredentialChangeRequest" ADD CONSTRAINT "CredentialChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
