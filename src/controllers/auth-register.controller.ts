import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PlayerRegisterBody } from "../types/player.type.js";
import bcrypt from "bcryptjs";
import { generateOtp, getOtpExpiry } from "../utils/otp.js";
import { PendingPayload } from "../types/pending_registration.type.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { ResponseHandler } from "../utils/Responsehandler.js";
import { OrganizationRegisterBody } from "../types/organization.type";


const resolveSportIds = async (categories?: string[]): Promise<string[]> => {
  const names = [...new Set((categories ?? []).map((c) => c.trim()).filter(Boolean))];
  if (names.length === 0) return [];

  const sports = await prisma.sport.findMany({
    where: { name: { in: names }, isActive: true },
    select: { id: true, name: true },
  });

  const found = new Set(sports.map((s) => s.name));
  const invalid = names.find((n) => !found.has(n));
  if (invalid) {
    throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
      data: { categories: [`Unknown or inactive sport: ${invalid}`] },
    });
  }

  return sports.map((s) => s.id);
};

export const registerPlayer = asyncHandler(async (req: Request, res: Response) => {
  const {
    username, name, email, birthday,
    contactNo, height, weight,
    categories, website_url, password, country
  } = req.body as PlayerRegisterBody;

  const sportIds = await resolveSportIds(categories);

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
        role:       "player",
        contactNo:  contactNo,
        height:     height      ?? null,
        weight:     weight      ?? null,
        birthday:   birthday    ? new Date(birthday).toISOString() : null,
        categories: categories  ?? [],
        sportIds,
        websiteUrl: website_url ?? null,
        city:       null,
        state:      null,
        country,
      } satisfies PendingPayload,
    },
  });


//note: remove comment when production
// await sendOtpEmail(email, otp);
//note: add comment when production
  console.log(otp);


  ResponseHandler.success(res, "OTP sent to your email. Please verify within 3 minutes.", { email });
});

export const registerOrganization = asyncHandler(async (req: Request, res: Response) => {
  const {
    username, name, email, contactNo,
    categories, website_url,
    city, state, country, password,
  } = req.body as OrganizationRegisterBody;

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
        categories: categories  ?? [],
        sportIds:   [],
        height:     null,
        weight:     null,
        birthday:   null,
      } satisfies PendingPayload,
    },
  });

  await sendOtpEmail(email, otp);
  console.log(otp);

  ResponseHandler.success(res, "OTP sent to your email. Please verify within 3 minutes.", { email });
});

export const listSports = asyncHandler(async (req: Request, res: Response) => {
  const sports = await prisma.sport.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true },
  });
  ResponseHandler.success(res, "Data found.", { sports });
});

export const orgCategory = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.orgCategory.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  ResponseHandler.success(res, "Data found.", { categories });
});