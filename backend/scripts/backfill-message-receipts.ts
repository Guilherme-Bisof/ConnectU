import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfill() {
  console.log("Iniciando backfill de MessageReceipts...");

  const batchSize = 500;
  let cursor: string | undefined = undefined;
  let hasMore = true;
  let totalCreated = 0;

  while (hasMore) {
    const messages = await prisma.message.findMany({
      take: batchSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: {
        room: {
          include: {
            users: { select: { id: true } },
            readStates: true,
          }
        },
        receipts: { select: { userId: true } } // Para idempotência
      }
    });

    if (messages.length === 0) {
      hasMore = false;
      break;
    }

    cursor = messages[messages.length - 1].id;

    const receiptsToCreate = [];

    for (const msg of messages) {
      const existingReceiptUserIds = new Set(msg.receipts.map(r => r.userId));
      
      const recipients = msg.room.users.filter(u => u.id !== msg.senderId);

      for (const recipient of recipients) {
        if (existingReceiptUserIds.has(recipient.id)) {
          continue; // Já tem receipt
        }

        const readState = msg.room.readStates.find(rs => rs.userId === recipient.id);
        const isRead = readState?.lastReadAt && readState.lastReadAt >= msg.createdAt;

        receiptsToCreate.push({
          messageId: msg.id,
          userId: recipient.id,
          deliveredAt: msg.createdAt, // Backfill default para as mensagens antigas
          readAt: isRead ? readState.lastReadAt : null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (receiptsToCreate.length > 0) {
      const created = await prisma.messageReceipt.createMany({
        data: receiptsToCreate,
        skipDuplicates: true
      });
      totalCreated += created.count;
      console.log(`Lote processado. Criados: ${created.count} recibos.`);
    }
  }

  console.log(`Backfill concluído! Total de recibos criados: ${totalCreated}`);
}

backfill()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
