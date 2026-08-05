import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth.type";
import { AppError } from "../utils/AppError";
import { ERROR_CODES } from "../constants/errorCodes";
import { verifyAccessToken } from "../utils/jwt";



export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new AppError(ERROR_CODES.SESSION_TOKEN_INVALID);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    throw new AppError(ERROR_CODES.SESSION_TOKEN_INVALID);
  }
};

export const authenticateAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new AppError(ERROR_CODES.SESSION_TOKEN_INVALID);
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new AppError(ERROR_CODES.SESSION_TOKEN_INVALID);
  }

  if (decoded.role !== "admin") {
    throw new AppError(ERROR_CODES.FORBIDDEN);
  }

  req.user = decoded;
  next();
};