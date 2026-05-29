import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middlewares/authMiddleware.js";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });


      if (!user || user.password !== password) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, companyId: user.companyId },
        JWT_SECRET,
        { expiresIn: "7d"}
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token: token,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno ao processar o login." });
    }
  }
}
