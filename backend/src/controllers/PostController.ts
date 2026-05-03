import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class PostController {
  // Criar uma nova publicação
  async create(req: Request, res: Response) {
    try {
      const { content, imageUrl, authorId } = req.body;

      const newPost = await prisma.post.create({
        data: {
          content,
          imageUrl,
          authorId,
        },
      });

      res.status(201).json(newPost);
    } catch (error) {
      console.error("Erro ao criar post:", error);
      res.status(400).json({ error: "Erro ao criar publicação." });
    }
  }

  // Listar o Feed
  async listFeed(req: Request, res: Response) {
    try {
      const posts = await prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              name: true,
              avatarUrl: true,
              role: true,
              course: true,
              institution: true,
            },
          },
        },
      });

      res.json(posts);
    } catch (error) {
      console.error("Erro ao carregar feed:", error);
      res.status(500).json({ error: "Erro interno ao carregar o feed." });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.post.delete({
        where: { id: String(id) },
      });

      res.status(200).json({ message: "Post deletado com sucesso!" });
    } catch (error) {
      console.error("Erro ao deletar post:", error);
      res.status(500).json({ error: "Erro ao deletar a publicação." });
    }
  }
}
