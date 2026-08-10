import z from "zod";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "./AppError";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../types/auth.type";
import { ApprovalStatus, FieldSection, FieldType, PlayerSide, UserRole } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { MatchFieldValueInput, TeamSlotValue } from "../schemas/match.schema";

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


const resolveTeamSlot = async (
  tx: Prisma.TransactionClient,
  input: TeamSlotValue | null,
): Promise<TeamResult> => {
  if (input === null) return { name: null, orgId: null };

  if (typeof input === "string") return { name: input, orgId: null };

  if ("orgId" in input) {
    const org = await tx.user.findUnique({
      where: { id: input.orgId },
      select: { id: true, name: true, role: true, isActive: true },
    });
    if (!org || org.role !== UserRole.organization || !org.isActive || !org.name) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
        data: { orgId: "Unknown, inactive, or not an organization" },
      });
    }
    return { name: org.name, orgId: org.id };
  }

  return { name: input.name, orgId: null };
};

const assertPlayerSideMatchesTeam = (
  side: PlayerSide | undefined,
  home: TeamResult,
  away: TeamResult,
): void => {
  if (side === PlayerSide.HOME && home.name === null) {
    throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
      data: { playerSide: "playerSide HOME requires a home team" },
    });
  }
  if (side === PlayerSide.AWAY && away.name === null) {
    throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
      data: { playerSide: "playerSide AWAY requires an away team" },
    });
  }
};

const teamOrgInclude = {
  homeTeamOrg: { select: { id: true, name: true } },
  awayTeamOrg: { select: { id: true, name: true } },
} as const;

const derivePlayerMatch = <T extends {
  homeTeam: string | null;
  awayTeam: string | null;
  playerSide: PlayerSide | null;
  homeTeamOrgId: string | null;
  awayTeamOrgId: string | null;
  homeTeamOrg: { id: string; name: string } | null;
  awayTeamOrg: { id: string; name: string } | null;
}>(match: T) => ({
  ...match,
  playerTeam: match.playerSide === PlayerSide.HOME ? match.homeTeam : match.playerSide === PlayerSide.AWAY ? match.awayTeam : null,
  playerTeamOrgId: match.playerSide === PlayerSide.HOME ? match.homeTeamOrgId : match.playerSide === PlayerSide.AWAY ? match.awayTeamOrgId : null,
  playerTeamOrg: match.playerSide === PlayerSide.HOME ? match.homeTeamOrg : match.playerSide === PlayerSide.AWAY ? match.awayTeamOrg : null,
});

const fetchPlayerMatches = async (userId: string, status?: ApprovalStatus) => {
  const rows = await prisma.playerMatch.findMany({
    where: { userId, ...(status !== undefined && { status }) },
    orderBy: { createdAt: "desc" },
    include: {
      sport: { select: { id: true, name: true, slug: true } },
      sportCategory: { select: { id: true, name: true, slug: true } },
      ...teamOrgInclude,
    },
  });
  return rows.map(derivePlayerMatch);
};

export type TeamResult = { name: string | null; orgId: string | null };




export { slugify, parseBody, parseParams, parseQueryEnum, assertFieldExists,assertNonEmptyUpdate, assertSportExists, requireUserId, fetchPlayerMatches, validateMatchValues, resolveTeamSlot, assertPlayerSideMatchesTeam, teamOrgInclude, derivePlayerMatch}