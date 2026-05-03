import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class UserController {
  async create(req: Request, res: Response) {
    try {
      const { name, email, password, role, course, institution, skills } =
        req.body;

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password,
          role,
          course,
          institution,
          skills,
        },
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(400).json({ error: "Erro ao criar usuário." });
    }
  }

  // Atualizar Perfil
  async updateProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { bio, skills, links, projects } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: String(id) },
        data: {
          bio,
          skills,
          ...(links && {
            links: {
              deleteMany: {},
              create: links,
            },
          }),

          ...(projects && {
            projects: {
              deleteMany: {},
              create: projects,
            }
          })
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          course: true,
          institution: true,
          bio: true,
          skills: true,
          links: true,
          projects: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ error: "Erro ao atualizar o perfil." });
    }
  }
}
