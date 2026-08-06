import z from "zod";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "./AppError";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../types/auth.type";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseBody = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.FIELD_VALIDATION_FAILED, { data: parsed.error.flatten() });
  }
  return parsed.data;
};

const parseParams = <T>(schema: z.ZodType<T>, params: unknown): T => {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.FIELD_VALIDATION_FAILED, { data: parsed.error.flatten() });
  }
  return parsed.data;
};

const parseQueryEnum = <T>(value: unknown, schema: z.ZodType<T>): T | undefined => {
  if (value === undefined) return undefined;
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT);
  }
  return parsed.data;
};

const assertNonEmptyUpdate = (body: object): void => {
  if (Object.keys(body).length === 0) {
    throw new AppError(ERROR_CODES.REQUIRED_FIELD_MISSING);
  }
};

const assertSportExists = async (sportId: string): Promise<void> => {
  const sport = await prisma.sport.findUnique({ where: { id: sportId }, select: { id: true } });
  if (!sport) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
};

const assertFieldExists = async (fieldId: string): Promise<void> => {
  const field = await prisma.sportField.findUnique({ where: { id: fieldId }, select: { id: true } });
  if (!field) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
};

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(ERROR_CODES.UNAUTHORIZED);
  return userId;
};
export { slugify, parseBody, parseParams, parseQueryEnum, assertFieldExists,assertNonEmptyUpdate, assertSportExists, requireUserId}