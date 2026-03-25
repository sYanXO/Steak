import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [openRecoveryDuplicates, openCredentialDuplicates] = await Promise.all([
    prisma.accountRecoveryRequest.groupBy({
      by: ["userId"],
      where: {
        status: "OPEN"
      },
      _count: {
        _all: true
      },
      having: {
        userId: {
          _count: {
            gt: 1
          }
        }
      }
    }),
    prisma.credentialChangeRequest.groupBy({
      by: ["userId", "type"],
      where: {
        verifiedAt: null
      },
      _count: {
        _all: true
      },
      having: {
        userId: {
          _count: {
            gt: 1
          }
        }
      }
    })
  ]);

  console.log(
    JSON.stringify(
      {
        openRecoveryDuplicates,
        openCredentialDuplicates,
        safeToApplyConstraintMigration:
          openRecoveryDuplicates.length === 0 && openCredentialDuplicates.length === 0
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
