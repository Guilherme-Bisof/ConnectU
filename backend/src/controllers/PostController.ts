import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

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
              isPioneer: true,
            },
          },
          likes: true,
          comments: {
            include: { user: true },
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

      res.status(200).json({ message: "Post deletado!" });
    } catch (error) {
      console.error("Erro ao deletar post:", error);
      res.status(500).json({ error: "Erro ao deletar a publicação." });
    }
  }

  async toggleLike(req: Request, res: Response) {
    const { postId } = req.params;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const existingLike = await prisma.like.findFirst({
      where: { postId: String(postId), userId: String(userId) },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res.json({ liked: false });
    } else {
      await prisma.like.create({
        data: { postId: String(postId), userId: String(userId) },
      });
      return res.json({ liked: true });
    }
  }

  async comment(req: Request, res: Response) {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    const comment = await prisma.comment.create({
      data: { content, postId: String(postId), userId: String(userId) },
      include: { user: true },
    });
    res.json(comment);
  }

  async deleteComment(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      if (!commentId) {
        return res
          .status(400)
          .json({ error: "ID do comentário é obrigatório." });
      }

      // @ts-ignore
      const userId = req.user.id;

      const comment = await prisma.comment.findUnique({
        where: { id: String(commentId) },
      });

      if (!comment) {
        return res.status(404).json({ error: "Comentário não encontrado." });
      }

      if (comment.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Você só pode deletar seus próprios comentários." });
      }

      await prisma.comment.delete({
        where: { id: String(commentId) },
      });

      res.json({ message: "Comentário removido." });
    } catch (error) {
      console.error("Erro ao deletar:", error);
      res.status(500).json({ error: "Erro interno." });
    }
  }
}
