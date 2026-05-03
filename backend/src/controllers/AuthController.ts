import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // 2. Se não achar o usuário ou a senha não bater, barra a entrada
      // (Nota: No futuro, usaremos o bcrypt para comparar senhas criptografadas aqui)
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }

      res.json(user);
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno ao processar o login." });
    }
  }
}
