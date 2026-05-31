import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middlewares/authMiddleware.js";
import bcrypt from "bcrypt";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }

      let isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        if (user.password === password) {
          isPasswordValid = true;

          const hashedPassword = await bcrypt.hash(password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });
        }
      }

      if (!isPasswordValid) {
        return res.status(401).json({ error: "E-mail ou senha inválidos."});
      }

      const token = jwt.sign(
        { id: user.id, Role: user.role, companyId: user.companyId },
        JWT_SECRET,
        { expiresIn: "7d" },
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
