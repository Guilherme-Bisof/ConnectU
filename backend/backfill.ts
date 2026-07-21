// @ts-nocheck
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function backfill() {
  console.log("Iniciando backfill de RoomReadState...");
  const rooms = await prisma.room.findMany({
    include: {
      users: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  let createdCount = 0;

  for (const room of rooms) {
    const lastMessage = room.messages[0];
    const lastReadAt = lastMessage ? lastMessage.createdAt : null;
    const lastReadMessageId = lastMessage ? lastMessage.id : null;

    for (const user of room.users) {
      const existing = await prisma.roomReadState.findUnique({
        where: {
          roomId_userId: { roomId: room.id, userId: user.id }
        }
      });

      if (!existing) {
        await prisma.roomReadState.create({
          data: {
            roomId: room.id,
            userId: user.id,
            lastReadAt: lastReadAt,
            lastReadMessageId: lastReadMessageId
          }
        });
        createdCount++;
      }
    }
  }

  console.log(`Backfill concluído! ${createdCount} RoomReadStates gerados.`);
}

backfill()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
