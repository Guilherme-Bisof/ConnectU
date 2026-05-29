import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class ApplicationController {
  async apply(req: Request, res: Response) {
    try {
      const { userId, jobId } = req.body;

      // Verifica se a vaga existe e está ativa
      const job = await prisma.job.findUnique({ where: { id: String(jobId) } });

      if (!job || !job.isActive) {
        return res
          .status(400)
          .json({ error: "Esta vaga não está mais disponível." });
      }

      // Tenta criar a candidatura 
      const application = await prisma.application.create({
        data: {
          userId: String(userId),
          jobId: String(jobId),
        },
      });

      res.status(201).json(application);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res
          .status(400)
          .json({ error: "Você já se candidatou a esta vaga!" });
      }
      console.error("Erro ao aplicar para vaga:", error);
      res.status(500).json({ error: "Erro interno ao processar candidatura." });
    }
  }

  async getJobApplication(req: Request, res: Response) {
    try{
      const { jobId } = req.params;

      // Busca todas as candidaturas da vaga e inclui os dados do aluno
      const applications = await prisma.application.findMany({
        where: { jobId: String(jobId)},
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              skills: true,
              course: true,
              institution: true,
            }
          },
          job: {
            select:{
              requiredSkills: true
            }
          }
        }
      });

      // Calcula a porcentagem de match para cada um dos alunos
      const applicantsWithMatch = applications.map(app => {
        const studentSkills = app.user.skills || [];
        const requiredSkills = app.job.requiredSkills || [];

        let matchCount = 0;
        requiredSkills.forEach(reqSkill => {
          // Compara ignorando maiúsculas/minuscúlas
          const hasSkill = studentSkills.some(studentSkills => studentSkills.toLowerCase().trim() === reqSkill.toLowerCase().trim());
          if(hasSkill) matchCount++;
        });

        // Evita divisão por zero caso a vaga não tenha skills exigidas
        const matchPercentage = requiredSkills.length > 0
        ? Math.round((matchCount / requiredSkills.length) * 100) : 100;

        // Retorna o objeto limpo, sem os dados duplicados da vaga
        return {
          applicationId: app.id,
          status: app.status,
          appliedAt: app.createdAt,
          matchPercentage,
          user: app.user
        };
      });

      // Ordena a lista (Os maiores matches aparecem primeiro)
      applicantsWithMatch.sort((a,b) => b.matchPercentage - a.matchPercentage);

      res.json(applicantsWithMatch);

    } catch(error) {
      console.error("Erro ao buscar candidatos:", error);
      res.status(500).json({ error: "Erro interno ao buscar candidatos da vaga."})
    }
  }
}
