import { Request, Response } from "express";
import { ResponseHandler } from "../utils/Responsehandler.js";
import { generateAccessToken, verifyRefreshToken } from "../utils/jwt.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/prisma.js";
import { JwtRefreshPayload, VerifyOtpBody } from "../types/auth.type.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PendingPayload } from "../types/pending_registration.type.js";
import { verifyOtpSchema } from "../schemas/auth.schema.js";


//todo: add prisma transition here in future
export const verifyRegistrationOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = verifyOtpSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(ERROR_CODES.FIELD_VALIDATION_FAILED, { data: result.error.flatten() });
  }

  const { email, otp } = result.data as VerifyOtpBody;

  const pending = await prisma.pendingRegistration.findFirst({
    where: { email },
  });

  if (!pending) {
    throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  if (new Date() > pending.expiresAt) {
    await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    throw new AppError(ERROR_CODES.CONFIRMATION_CODE_EXPIRED);
  }

  if (pending.otp !== otp) {
    throw new AppError(ERROR_CODES.WRONG_CONFIRMATION_CODE);
  }

  const payload = pending.payload as unknown as PendingPayload;

  const user = await prisma.user.create({
    data: {
      email:        payload.email,
      username:     payload.username,
      name:         payload.name,
      passwordHash: payload.passwordHash,
      role:         payload.role,
      contactNo:    payload.contactNo  ?? null,
      height:       payload.height     ?? null,
      weight:       payload.weight     ?? null,
      birthday:     payload.birthday   ? new Date(payload.birthday) : null,
      categories:   payload.categories ?? [],
      websiteUrl:   payload.websiteUrl ?? null,
      city:         payload.city       ?? null,
      state:        payload.state      ?? null,
      country:      payload.country    ?? null,
    },
  });

  const sportIds = payload.sportIds ?? [];
  if (payload.role === "player" && sportIds.length > 0) {
    await prisma.playerSportProfile.createMany({
      data: sportIds.map((sportId) => ({ userId: user.id, sportId })),
      skipDuplicates: true,
    });
  }

  await prisma.pendingRegistration.delete({ where: { id: pending.id } });

  ResponseHandler.success(res, "Account verified and created successfully.", {
    id: user.id,
    email: user.email,
    role: user.role,
  }, 201);
});

export const verifySession = asyncHandler(async (req: Request, res: Response) => {
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

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    res.clearCookie('refreshToken', { path: '/token' });
    throw new AppError(ERROR_CODES.USER_NOT_FOUND);
  }

  const newAccessToken = generateAccessToken(user);

  ResponseHandler.success(res, "Session verified.", {
    accessToken: newAccessToken,
    user,
  });
});