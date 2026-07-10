import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

function getMonthsUntilGraduation(
  endDateStr: string | null | undefined,
): number {
  if (!endDateStr) return 0;

  let year, month;

  // Tenta extrair mes e ano do formato "MM/YYYY" ou parecido
  if (endDateStr.includes("/")) {
    const parts = endDateStr.split("/");
    month = parseInt(parts[0] || "0", 10);
    year = parseInt(parts[1] || "0", 10);

    if (year < 100) {
      year += 2000;
    }
  } else {
    // Tenta formato padrao de data do JS (ex: "YYYY-MM-DD")
    const date = new Date(endDateStr);
    if (!isNaN(date.getTime())) {
      year = date.getFullYear();
      month = date.getMonth() + 1;
    }
  }

  if (!year || !month) return 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (year - currentYear) * 12 + (month - currentMonth);
}

export class JobController {
  async create(req: Request, res: Response) {
    try {
      const {
        title,
        type,
        description,
        requiredSkills,
        desirableSkills,
        isInternship,
        companyId,
      } = req.body;

      const newJob = await prisma.job.create({
        data: {
          title,
          type,
          description,
          requiredSkills: requiredSkills || [],
          desirableSkills: desirableSkills || [],
          isInternship: isInternship || false,
          companyId,
        },
      });

      res.status(201).json(newJob);
    } catch (error) {
      console.error("Erro ao criar vaga:", error);
      res.status(400).json({ error: "Erro ao criar vaga." });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { jobId } = req.params;

      await prisma.application.deleteMany({
        where: { jobId: String(jobId)},
      })

      await prisma.job.delete({
        where: { id: String(jobId) },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir vaga:", error);
      res.status(500).json({ error: "Erro interno ao excluir a vaga." });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const {
        title,
        type,
        description,
        requiredSkills,
        desirableSkills,
        isInternship,
      } = req.body;

      const updatedJob = await prisma.job.update({
        where: { id: String(jobId) },
        data: {
          title,
          type,
          description,
          requiredSkills: requiredSkills || [],
          desirableSkills: desirableSkills || [],
          isInternship: isInternship || false,
        },
      });

      res.json(updatedJob);
    } catch (error) {
      console.error("Erro ao atualizar vaga:", error);
      res.status(500).json({ error: "Erro interno ao atualizar a vaga." });
    }
  }

  async toggleStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const { isActive } = req.body;

      const updatedJob = await prisma.job.update({
        where: { id: String(jobId) },
        data: { isActive },
      });

      res.json(updatedJob);
    } catch (error) {
      console.error("Erro ao atualizar status da vaga:", error);
      res.status(500).json({ error: "Erro interno ao atualizar status." });
    }
  }

  async updateApplicantStatus(req: Request, res: Response) {
    try {
      const { jobId, userId } = req.params;
      const { status } = req.body;

      const application = await prisma.application.findFirst({
        where: { jobId: String(jobId), userId: String(userId) }
      });

      if (!application) {
        return res.status(404).json({ error: "Candidatura não encontrada." });
      }

      const updatedApplication = await prisma.application.update({
        where: { id: application.id },
        data: { status }
      });

      res.json(updatedApplication);
    } catch (error) {
      console.error("Erro ao atualizar status do candidato:", error);
      res.status(500).json({ error: "Erro interno ao atualizar status." });
    }
  }

  async getByCompany(req: Request, res: Response) {
    try {
      const { companyId } = req.params;

      const jobs = await prisma.job.findMany({
        where: { companyId: String(companyId) },
        orderBy: { createdAt: "desc" },

        include: {
          applications: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  course: true,
                  institution: true,
                  skills: true,
                },
              },
            },
          },
        },
      });
      res.json(jobs);
    } catch (error) {
      console.error("Erro ao buscar vagas da empresa:", error);
      res.status(500).json({ error: "Erro ao buscar vagas." });
    }
  }

  async getMatches(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Busca o aluno no banco para pegar as skills dele
      const user = await prisma.user.findUnique({
        where: { id: String(userId) },
      });

      if (!user || user.role !== "STUDENT") {
        return res.status(404).json({ error: "Aluno não encontrado." });
      }

      // Busca todas as vagas ativas
      const jobs = await prisma.job.findMany({
        where: { isActive: true },
        include: {
          company: { select: { name: true } },
          applications: { select: { userId: true } },
        },
      });

      // Cruza os dados: Skills do Aluno vs Requisitos da Vaga
      const userSkills = user.skills || [];

      const userSkillsLower = userSkills.map((s: string) => s.toLowerCase());

      const monthsToGraduation = getMonthsUntilGraduation(user.endDate);

      const matchedJobs = jobs
        .map((job: any) => {
          if (job.isInternship && monthsToGraduation < 12) {
            return null;
          }

          const required: string[] = job.requiredSkills || [];
          const desirable: string[] = job.desirableSkills || [];

          const matchRequiredCount = required.filter((skill: string) =>
            userSkillsLower.includes(skill.toLowerCase()),
          ).length;

          const matchedDesirableCount = desirable.filter((skill: string) =>
            userSkillsLower.includes(skill.toLowerCase()),
          ).length;

          const maxPoints = required.length * 3 + desirable.length * 1;

          let matchPercentage = 0;

          if (maxPoints > 0) {
            const userPoints =
              matchRequiredCount * 3 + matchedDesirableCount * 1;
            matchPercentage = Math.round((userPoints / maxPoints) * 100);
          } else {
            matchPercentage = 100;
          }

          const hasCoreSkills = required.length === 0 || matchRequiredCount > 0;

          return {
            ...job,
            matchPercentage,
            hasCoreSkills,
          };
        })

        .filter((job: any) => job !== null && job.matchPercentage > 0)

        .sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);

      res.json(matchedJobs);
    } catch (error) {
      console.error("Erro ao gerar match:", error);
      res.status(500).json({ error: "Erro interno ao processar matches." });
    }
  }

  async removeApplicant(req: Request, res: Response) {
    try {
      const { jobId, userId } = req.params;

      await prisma.application.deleteMany({
        where: {
          jobId: String(jobId),
          userId: String(userId),
        },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Erro ao remover candidato:", error);
      res.status(500).json({ error: "Erro interno ao remover candidato." });
    }
  }
}
