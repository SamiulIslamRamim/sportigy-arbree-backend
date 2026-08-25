import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../utils/asyncHandler";
import { JwtRefreshPayload, LoginBody } from "../types/auth.type.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError";
import { ERROR_CODES } from "../constants/errorCodes";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { ResponseHandler } from "../utils/Responsehandler";



const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/token',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as LoginBody;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: username }, { username }] },
  });

  if (!user) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND);
  }

  if (!user.isActive) {
    throw new AppError(ERROR_CODES.ACCOUNT_DISABLED);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(ERROR_CODES.INVALID_EMAIL_PASSWORD);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  ResponseHandler.success(res, "Login successful.", {
    accessToken: accessToken,
    user,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AppError(ERROR_CODES.SESSION_TOKEN_INVALID);
  }

  let decoded: JwtRefreshPayload;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(ERROR_CODES.SESSION_INVALID);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    res.clearCookie('refreshToken', { path: '/token' });
    throw new AppError(ERROR_CODES.USER_NOT_FOUND);
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

  ResponseHandler.success(res, "Token refreshed successfully.", {
    accessToken: newAccessToken,
  });
});