import z from "zod";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "./AppError";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../types/auth.type";
import { ApprovalStatus, FieldSection, FieldType } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { MatchFieldValueInput } from "../schemas/match.schema";

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

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(ERROR_CODES.UNAUTHORIZED);
  return userId;
};

//sport-helper
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

//match-helper
const fetchPlayerMatches = async (userId: string, status?: ApprovalStatus) => {
  return prisma.playerMatch.findMany({
    where: { userId, ...(status !== undefined && { status }) },
    orderBy: { createdAt: "desc" },
    include: {
      sport: { select: { id: true, name: true, slug: true } },
      sportCategory: { select: { id: true, name: true, slug: true } },
    },
  });
};

const validateMatchValues = async (
  tx: Prisma.TransactionClient,
  sportId: string,
  values: MatchFieldValueInput[],
): Promise<Prisma.PlayerMatchFieldValueUncheckedCreateWithoutPlayerMatchInput[]> => {
  const fieldIds = values.map((v) => v.fieldId);
  if (new Set(fieldIds).size !== fieldIds.length) {
    throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
  }

  const fields = await tx.sportField.findMany({
    where: { sportId, section: FieldSection.MATCH, isActive: true },
    select: {
      id: true,
      type: true,
      options: { where: { isActive: true }, select: { id: true } },
    },
  });
  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  return values.map((v) => {
    const field = fieldMap.get(v.fieldId);
    if (!field) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: { fieldId: `Unknown or inactive match field: ${v.fieldId}` },
      });
    }

    if (field.type === FieldType.SELECT || field.type === FieldType.MULTI_SELECT) {
      if (v.optionId === undefined) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: { fieldId: v.fieldId, message: "optionId is required for this field" },
        });
      }
      const optionExists = field.options.some((o) => o.id === v.optionId);
      if (!optionExists) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: { fieldId: v.fieldId, optionId: `Unknown option for field: ${v.optionId}` },
        });
      }
      return { fieldId: v.fieldId, optionId: v.optionId };
    }

    if (field.type === FieldType.NUMBER) {
      if (v.valueNumber === undefined) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: { fieldId: v.fieldId, message: "valueNumber is required for this field" },
        });
      }
      return { fieldId: v.fieldId, valueNumber: v.valueNumber };
    }

    if (field.type === FieldType.TEXT) {
      if (v.valueText === undefined) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: { fieldId: v.fieldId, message: "valueText is required for this field" },
        });
      }
      return { fieldId: v.fieldId, valueText: v.valueText };
    }

    if (field.type === FieldType.BOOLEAN) {
      if (v.valueBoolean === undefined) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: { fieldId: v.fieldId, message: "valueBoolean is required for this field" },
        });
      }
      return { fieldId: v.fieldId, valueBoolean: v.valueBoolean };
    }

    if (v.valueDate === undefined) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: { fieldId: v.fieldId, message: "valueDate is required for this field" },
      });
    }
    return { fieldId: v.fieldId, valueDate: v.valueDate };
  });
};


export { slugify, parseBody, parseParams, parseQueryEnum, assertFieldExists,assertNonEmptyUpdate, assertSportExists, requireUserId, fetchPlayerMatches, validateMatchValues}