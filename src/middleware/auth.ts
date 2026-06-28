import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AuthenticatedRequest } from "../types/auth.type.js";

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Authentication credentials were not provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ detail: "Token not found." });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ detail: "Token is invalid or expired." });
  }
};