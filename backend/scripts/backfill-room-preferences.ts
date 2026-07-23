import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando backfill de RoomPreference (legacy mutedRooms)...");
  
  const usersWithMuted = await prisma.user.findMany({
    where: {
      mutedRooms: {
        isEmpty: false
      }
    },
    select: {
      id: true,
      mutedRooms: true,
      rooms: {
        select: {
          id: true
        }
      }
    }
  });

  console.log(`Encontrados ${usersWithMuted.length} usuários com mutedRooms legacy.`);

  let createdCount = 0;
  let ignoredCount = 0;
  let invalidCount = 0;

  for (const user of usersWithMuted) {
    const userRoomIds = new Set(user.rooms.map(r => r.id));

    for (const roomId of user.mutedRooms) {
      if (!userRoomIds.has(roomId)) {
        invalidCount++;
        continue;
      }

      // Upsert RoomPreference
      const pref = await prisma.roomPreference.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: user.id
          }
        },
        update: {
          isMuted: true,
          mutedAt: new Date()
        },
        create: {
          roomId,
          userId: user.id,
          isMuted: true,
          mutedAt: new Date()
        }
      });
      createdCount++;
    }
  }

  console.log("Backfill concluído!");
  console.log(`Criados/Atualizados: ${createdCount}`);
  console.log(`Inválidos (sala não encontrada/usuário não pertence): ${invalidCount}`);
}

main()
  .catch((e) => {
    console.error("Erro no backfill:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
