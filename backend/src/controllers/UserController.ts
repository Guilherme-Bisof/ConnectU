import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";

export class UserController {
  async create(req: Request, res: Response) {
    try {
      const { name, email, password, role, course, institution, skills } =
        req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      let companyId = null;

      if (role === "RECRUITER") {
        let defaultCompany = await prisma.company.findFirst({
          where: { name: "ConnectU Labs"},
        });

        if (!defaultCompany) {
          defaultCompany = await prisma.company.create({
            data: { name: "ConnectU Labs"},
          });
        }

        companyId = defaultCompany.id;
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          companyId,
          course: role === "STUDENT" ? course : null,
          institution: role === "STUDENT" ? institution: null,
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
      const {
        bio,
        skills,
        links,
        projects,
        name,
        course,
        institution,
        avatarUrl,
        bannerUrl,
        degreeType,
        startDate,
        endDate,
        resumeUrl,
      } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: String(id) },
        data: {
          name,
          course,
          institution,
          avatarUrl,
          bannerUrl,
          degreeType,
          startDate,
          endDate,
          resumeUrl,
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
            },
          }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          companyId: true,
          course: true,
          institution: true,
          avatarUrl: true,
          bannerUrl: true,
          degreeType: true,
          startDate: true,
          endDate: true,
          resumeUrl: true,
          isPioneer: true,
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

  async uploadUserAvatar(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      const imageUrl = req.file?.path as string;

      const updatedUser = await prisma.user.update({
        where: { id: String(id) },
        data: { avatarUrl: imageUrl },
      });

      res.json({ avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
      console.log("Erro no upload de avatar:", error);
      res.status(500).json({ error: "Erro ao processar imagem." });
    }
  }

  async uploadUserResume(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      const resumeUrl = req.file.path as string;

      const updatedUser = await prisma.user.update({
        where: { id: String(id) },
        data: { resumeUrl: resumeUrl },
      });

      res.json({ resumeUrl: updatedUser.resumeUrl });
    } catch (error) {
      console.error("Erro no upload do currículo:", error);
      res.status(500).json({ error: "Erro ao processar currículo." });
    }
  }

  async uploadUserBanner(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada." });
      }

      const bannerUrl = req.file.path as string;

      const updatedUser = await prisma.user.update({
        where: { id: String(id) },
        data: { bannerUrl: bannerUrl },
      });

      res.json({ bannerUrl: updatedUser.bannerUrl });
    } catch (error) {
      console.error("Erro no upload do banner:", error);
      res.status(500).json({ error: "Erro ao processar o banner." });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: String(id) },
        select: {
          id: true,
          name: true,
          role: true,
          companyId: true,
          avatarUrl: true,
          bannerUrl: true,
          degreeType: true,
          startDate: true,
          endDate: true,
          resumeUrl: true,
          isPioneer: true,
          course: true,
          institution: true,
          bio: true,
          skills: true,
          links: true,
          projects: true,
        },
      });

      if (!user) {
        return res.status(400).json({ error: "Usuário não encontrado." });
      }

      res.json(user);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Erro interno ao buscar o perfil." });
    }
  }
}
