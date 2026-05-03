import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class JobController {
  async create(req: Request, res: Response) {
    try {
      const { title, description, requiredSkills, companyId } = req.body;

      const newJob = await prisma.job.create({
        data: {
          title,
          description,
          requiredSkills,
          companyId,
        },
      });

      res.status(201).json(newJob);
    } catch (error) {
      console.error("Erro ao criar vaga:", error);
      res.status(400).json({ error: "Erro ao criar vaga." });
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
        include: { company: { select: { name: true } } }, 
      });

      // Cruza os dados: Skills do Aluno vs Requisitos da Vaga
      const userSkills = user.skills || [];

      const matchedJobs = jobs.map((job:any) => {
        
        const required: string[] = job.requiredSkills || [];

        const matchCount = required.filter((skill: string) => userSkills.includes(skill)).length;

        const matchPercentage = required.length > 0
        ? Math.round((matchCount / required.length) * 100)
        : 0 ;

        return {
            ...job,
            matchPercentage
        };
      })

        .filter((job: any) => job.matchPercentage > 0)

        .sort((a:any, b:any) => b.matchPercentage - a.matchPercentage);

      res.json(matchedJobs);
    } catch (error) {
      console.error("Erro ao gerar match:", error);
      res.status(500).json({ error: "Erro interno ao processar matches." });
    }
  }
}
