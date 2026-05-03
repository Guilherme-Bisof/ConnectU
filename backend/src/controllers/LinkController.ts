import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class LinkController {
  // Adiciona um novo link no perfil do usuário
  async create(req: Request, res: Response) {
    try {
      const { label, url, userId } = req.body;

      const newLink = await prisma.link.create({
        data: {
          label,
          url,
          userId,
        },
      });

      res.status(201).json(newLink);
    } catch (error) {
      console.error("Erro ao adicionar link:", error);
      res.status(400).json({ error: "Erro ao adicionar link." });
    }
  }
}
