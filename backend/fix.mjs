import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const orphans = await prisma.$executeRawUnsafe('UPDATE "Notification" SET "senderId" = NULL WHERE "senderId" IS NOT NULL AND "senderId" NOT IN (SELECT "id" FROM "User")');
  console.log("Fixed orphans");
}

main().finally(() => prisma.$disconnect());
