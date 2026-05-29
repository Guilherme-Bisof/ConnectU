import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { error } from "node:console";

export const JWT_SECRET = "connectu_super_secret_key_2026";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ error: "Token ausente ou mal formatado." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    //@ts-ignore
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
