import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { JwtRefreshPayload, LoginBody } from "../../types/auth.type.js";
import { prisma } from "../../config/prisma.js";
import { generateAdminAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";
import { ResponseHandler } from "../../utils/Responsehandler";


const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/admin',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Admin Login ────────────────────────────────────────────────
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as LoginBody;

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) {
    throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
  }

  const accessToken = generateAdminAccessToken({ id: admin.id, role: admin.role });
  const refreshToken = generateRefreshToken({ id: admin.id });

  res.cookie('refreshToken', refreshToken, ADMIN_COOKIE_OPTIONS);

  ResponseHandler.success(res, "Login successful.", {
    accessToken,
    admin: { id: admin.id, username: admin.username, role: admin.role },
  });
});

// ─── Admin Refresh ──────────────────────────────────────────────
export const adminRefresh = asyncHandler(async (req: Request, res: Response) => {
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

  const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
  if (!admin) {
    res.clearCookie('refreshToken', { path: '/admin' });
    throw new AppError(ERROR_CODES.USER_NOT_FOUND);
  }

  const newAccessToken = generateAdminAccessToken({ id: admin.id, role: admin.role });
  const newRefreshToken = generateRefreshToken({ id: admin.id });

  res.cookie('refreshToken', newRefreshToken, ADMIN_COOKIE_OPTIONS);

  ResponseHandler.success(res, "Token refreshed successfully.", {
    accessToken: newAccessToken,
  });
});

// ─── Admin Verify Session ───────────────────────────────────────
export const adminVerifySession = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new AppError(ERROR_CODES.SESSION_TOKEN_INVALID);
  }

  let decoded: JwtRefreshPayload;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(ERROR_CODES.SESSION_EXPIRED);
  }

  const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
  if (!admin) {
    res.clearCookie('refreshToken', { path: '/admin' });
    throw new AppError(ERROR_CODES.USER_NOT_FOUND);
  }

  const newAccessToken = generateAdminAccessToken({ id: admin.id, role: admin.role });

  ResponseHandler.success(res, "Session verified.", {
    accessToken: newAccessToken,
    admin: { id: admin.id, username: admin.username, role: admin.role },
  });
});

// ─── Admin Logout ───────────────────────────────────────────────
export const adminLogout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
  });

  ResponseHandler.success(res, "Logged out successfully.", {});
});