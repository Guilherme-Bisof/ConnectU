import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { NotificationService } from "../services/NotificationService.js";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export class PostController {
  async create(req: Request, res: Response) {
    try {
      const { content, authorId } = req.body;

      if (!content || !authorId) {
        return res
          .status(400)
          .json({ error: "Conteúdo e autor são obrigatórios." });
      }

      const imageUrl = req.file ? (req.file.path as string) : null;

      const newPost = await prisma.post.create({
        data: {
          content,
          imageUrl,
          authorId,
        },
        include: {
          author: {
            select: {
              name: true,
              role: true,
              course: true,
              institution: true,
              avatarUrl: true,
              isPioneer: true,
            },
          },
          likes: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  isPioneer: true,
                },
              },
            },
          },
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const posts = await prisma.post.findMany({
        take: limit,
        skip: skip,
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
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return res.json(posts || []);
    } catch (error) {
      console.error("Erro ao carregar feed:", error);
      res.status(500).json({ error: "Erro interno ao carregar o feed." });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const postExists = await prisma.post.findUnique({
        where: { id: String(id) },
      });

      if (!postExists) {
        return res
          .status(404)
          .json({ error: "Esta publicação já não existe." });
      }

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

      const post = await prisma.post.findUnique({ where: { id: String(postId) } });
      const sender = await prisma.user.findUnique({ where: { id: String(userId) } });

      if (post && sender && post.authorId !== userId) {
        await NotificationService.create({
          userId: post.authorId,
          senderId: String(userId),
          type: "LIKE",
          title: "Nova curtida no seu post!",
          content: `${sender.name} curtiu sua publicação.`,
          postId: String(postId)
        });
      }

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

    const post = await prisma.post.findUnique({ where: { id: String(postId) } });

    if (post && post.authorId !== userId){
      await NotificationService.create({
        userId: post.authorId,
        senderId: String(userId),
        type: "COMMENT",
        title: "Novo comentário no seu post!",
        content: `${comment.user.name} comentou: "${content.substring(0, 40)}${content.length > 40 ? "..." : ""}`,
        postId: String(postId)
      });
    }
    
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
