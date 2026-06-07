import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";

export const registerSocketEvents = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Novo utilizador conectado: ${socket.id}`);

    socket.on("join_room", (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} entrou na sala: ${roomId}`);
    });

    socket.on(
      "send_message",
      async (data: { roomId: string; senderId: string; content: string }) => {
        const { roomId, senderId, content } = data;

        try {
          const savedMessage = await prisma.message.create({
            data: {
              content,
              roomId,
              senderId,
            },
          });

          io.to(roomId).emit("receive_message", savedMessage);
        } catch (error) {
          console.error("Erro ao salvar a mensagem no DB:", error);
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`Utilizador desconectado: ${socket.id}`);
    });
  });
};
