import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { ResponseHandler } from "../utils/Responsehandler";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { sendOtpEmail } from "../utils/mailer";
import { PendingPayload } from "../types/pending_registration.type";
import { generateOtp, getOtpExpiry } from "../utils/otp";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "../utils/AppError";
import { OrganizationRegisterBody } from "../types/organization.type";
import { PlayerRegisterBody } from "../types/player.type";

// Placeholder sport whitelist — finalize in Phase 2
const KNOWN_SPORTS = ["Cricket", "Football", "Golf", "Table-Tennis", "Tennis", "Badminton"];

const assertKnownSports = (categories?: string[]): void => {
  const invalid = (categories ?? []).find((c) => !KNOWN_SPORTS.includes(c));
  if (invalid) {
    throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT);
  }
};

export const registerPlayer = asyncHandler(async (req: Request, res: Response) => {
  const {
    username, name, email, birthday,
    contactNo, height, weight,
    categories, website_url, password, country
  } = req.body as PlayerRegisterBody;

  assertKnownSports(categories);

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError(ERROR_CODES.EMAIL_EXISTS);
    }
    throw new AppError(ERROR_CODES.ACCOUNT_EXISTS);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  const hasCricket = categories?.includes("Cricket") ?? false;

  await prisma.pendingRegistration.deleteMany({ where: { email } });

  await prisma.pendingRegistration.create({
    data: {
      email,
      username,
      otp,
      expiresAt,
      payload: {
        email,
        username,
        name,
        passwordHash,
        role:       "player",
        contactNo:  contactNo,
        height:     height      ?? null,
        weight:     weight      ?? null,
        birthday:   birthday    ? new Date(birthday).toISOString() : null,
        categories: categories  ?? [],
        websiteUrl: website_url ?? null,
        city:       null,
        state:      null,
        country,
        shouldCreateCricketProfile: hasCricket,
      } satisfies PendingPayload,
    },
  });

  await sendOtpEmail(email, otp);
  console.log(otp);

  ResponseHandler.success(res, "OTP sent to your email. Please verify within 3 minutes.", { email });
});

export const registerOrganization = asyncHandler(async (req: Request, res: Response) => {
  const {
    username, name, email, contactNo,
    categories, website_url,
    city, state, country, password,
  } = req.body as OrganizationRegisterBody;

  assertKnownSports(categories);

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError(ERROR_CODES.EMAIL_EXISTS);
    }
    throw new AppError(ERROR_CODES.ACCOUNT_EXISTS);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await prisma.pendingRegistration.deleteMany({ where: { email } });

  await prisma.pendingRegistration.create({
    data: {
      email,
      username,
      otp,
      expiresAt,
      payload: {
        email,
        username,
        name,
        passwordHash,
        role:       "organization",
        contactNo:  contactNo,
        websiteUrl: website_url ?? null,
        city:       city        ?? null,
        state:      state       ?? null,
        country:    country     ?? null,
        categories: categories ?? [],
        height:     null,
        weight:     null,
        birthday:   null,
        shouldCreateCricketProfile: false,
      } satisfies PendingPayload,
    },
  });

  await sendOtpEmail(email, otp);
  console.log(otp);

  ResponseHandler.success(res, "OTP sent to your email. Please verify within 3 minutes.", { email });
});

export const playerCategory = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.sport.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  ResponseHandler.success(res, "Data found.", { categories });
});

export const orgCategory = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.orgCategory.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  ResponseHandler.success(res, "Data found.", { categories });
});