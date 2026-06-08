import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middlewares/authMiddleware.js";

export const registerSocketEvents = (io: Server) => {

  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers["authorization"];

    if (!token) {
      return next(
        new Error(
          "Acesso negado. Token de autenticação não fornecido no Socket.",
        ),
      );
    }

    try {
      const cleanToken = token.startsWith("Bearer ")
        ? token.split(" ")[1]
        : token;
      const decoded = jwt.verify(cleanToken, JWT_SECRET);
      (socket as any).user = decoded; // Injeta os dados do usuário autenticado dentro do socket instance
      next();
    } catch (err) {
      return next(
        new Error("Sua sessão expirou ou o token do Socket é inválido."),
      );
    }
  });

  io.on("connection", (socket: Socket) => {
    const authUser = (socket as any).user;
    console.log(
      `Usuário autenticado conectado ao Socket: ${authUser.name} (${socket.id})`,
    );

    socket.on("join_room", async (roomId: string) => {
      // Validação de Contexto: Impede injeção de IDs de salas alheias
      const hasAccess = await prisma.room.findFirst({
        where: {
          id: roomId,
          users: { some: { id: authUser.id } },
        },
      });

      if (!hasAccess) {
        console.warn(
          `Tentativa de invasão detectada: Socket ${socket.id} tentou acessar a sala ${roomId}`,
        );
        return;
      }

      socket.join(roomId);
      console.log(
        `Usuário ${authUser.name} entrou com segurança na sala: ${roomId}`,
      );
    });

    socket.on(
      "send_message",
      async (data: { roomId: string; content: string }) => {
        const { roomId, content } = data;
        const senderId = authUser.id; 

        if (!content || content.trim() === "") return;

        try {
         
          const belongsToRoom = await prisma.room.findFirst({
            where: {
              id: roomId,
              users: { some: { id: senderId } },
            },
          });

          if (!belongsToRoom) return;

          const savedMessage = await prisma.message.create({
            data: {
              content,
              roomId,
              senderId,
            },
          });

          io.to(roomId).emit("receive_message", savedMessage);
        } catch (error) {
          console.error("Erro ao salvar e transmitir mensagem:", error);
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`Usuário desconectado do Socket: ${authUser.name}`);
    });
  });
};
