import { Response } from "express";
import { ApprovalStatus, MatchResult, Prisma, UserRole } from "../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { ERROR_CODES } from "../../constants/errorCodes";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthenticatedRequest } from "../../types/auth.type";
import { parseBody, parseQueryEnum, requireUserId, teamKeyFor } from "../../utils/helper";
import { byTeamStatsQuerySchema, hiddenQuerySchema, sportQuerySchema, teamVisibilitySchema } from "../../schemas/career.schema";
import { ResponseHandler } from "../../utils/Responsehandler";
import { CategoryStatRow, CountValue, FieldStat, NumericValue, ResultBreakdown, TeamRow, TeamStatRow } from "../../types/career.type";

const UNCATEGORIZED_KEY = "__uncategorized__";


const emptyBreakdown = (): ResultBreakdown => ({
  [MatchResult.WIN]: 0,
  [MatchResult.LOSS]: 0,
  [MatchResult.DRAW]: 0,
  [MatchResult.TIE]: 0,
  [MatchResult.NO_RESULT]: 0,
});

const toNumber = (value: CountValue | NumericValue): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value !== "") return Number(value);
  if (typeof value === "object" && typeof (value as { toNumber?: () => number }).toNumber === "function") {
    return (value as { toNumber(): number }).toNumber();
  }
  return Number(value);
};

const assertActiveSport = async (sportId: string): Promise<void> => {
  const sport = await prisma.sport.findUnique({
    where: { id: sportId },
    select: { id: true, isActive: true },
  });
  if (!sport || !sport.isActive) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
};

// Keep the team_key CASE in sync with helper.ts teamKeyFor()/normalizeTeamName().
const buildSideCte = (userId: string, sportId: string): Prisma.Sql =>
  Prisma.sql`(
    SELECT
      pm.id AS match_id,
      pm.result,
      CASE
        WHEN pm.player_side = 'HOME'::"PlayerSide" AND pm.home_team_org_id IS NOT NULL THEN 'org:' || pm.home_team_org_id::text
        WHEN pm.player_side = 'HOME'::"PlayerSide" THEN 'name:' || lower(btrim(pm.home_team))
        WHEN pm.player_side = 'AWAY'::"PlayerSide" AND pm.away_team_org_id IS NOT NULL THEN 'org:' || pm.away_team_org_id::text
        WHEN pm.player_side = 'AWAY'::"PlayerSide" THEN 'name:' || lower(btrim(pm.away_team))
        ELSE NULL
      END AS team_key,
      CASE
        WHEN pm.player_side = 'HOME'::"PlayerSide" THEN pm.home_team_org_id
        WHEN pm.player_side = 'AWAY'::"PlayerSide" THEN pm.away_team_org_id
        ELSE NULL
      END AS team_org_id,
      CASE
        WHEN pm.player_side = 'HOME'::"PlayerSide" THEN pm.home_team
        WHEN pm.player_side = 'AWAY'::"PlayerSide" THEN pm.away_team
        ELSE NULL
      END AS team_name
    FROM player_matches pm
    WHERE pm.user_id = ${userId}::uuid
      AND pm.sport_id = ${sportId}::uuid
      AND pm.status = 'APPROVED'::"ApprovalStatus"
      AND pm.player_side IS NOT NULL
  )`;

export const getCareerStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { sportId } = parseBody(sportQuerySchema, req.query);
    await assertActiveSport(sportId);

    const [grouped, statRows] = await Promise.all([
      prisma.playerMatch.groupBy({
        by: ["sportCategoryId", "result"],
        where: { userId, sportId, status: ApprovalStatus.APPROVED },
        _count: { _all: true },
      }),
      prisma.$queryRaw<CategoryStatRow[]>`
        SELECT
          pm.sport_category_id AS "categoryId",
          fv.field_id AS "fieldId",
          f.name AS "fieldName",
          SUM(fv.value_number) AS "total"
        FROM player_matches pm
        JOIN player_match_field_values fv ON fv.player_match_id = pm.id
        JOIN sport_fields f ON f.id = fv.field_id
        WHERE pm.user_id = ${userId}::uuid
          AND pm.sport_id = ${sportId}::uuid
          AND pm.status = 'APPROVED'::"ApprovalStatus"
          AND f.type = 'NUMBER'::"FieldType"
        GROUP BY pm.sport_category_id, fv.field_id, f.name
      `,
    ]);

    const categoryMap = new Map<
      string,
      { categoryId: string | null; matchesPlayed: number; resultBreakdown: ResultBreakdown; stats: FieldStat[] }
    >();
    for (const row of grouped) {
      const key = row.sportCategoryId ?? UNCATEGORIZED_KEY;
      let entry = categoryMap.get(key);
      if (!entry) {
        entry = { categoryId: row.sportCategoryId, matchesPlayed: 0, resultBreakdown: emptyBreakdown(), stats: [] };
        categoryMap.set(key, entry);
      }
      entry.matchesPlayed += row._count._all;
      entry.resultBreakdown[row.result] += row._count._all;
    }
    for (const row of statRows) {
      const entry = categoryMap.get(row.categoryId ?? UNCATEGORIZED_KEY);
      if (entry) {
        entry.stats.push({ fieldId: row.fieldId, fieldName: row.fieldName, total: toNumber(row.total) });
      }
    }

    const categoryIds = [...categoryMap.values()]
      .map((e) => e.categoryId)
      .filter((id): id is string => id !== null);
    const categoryRows = categoryIds.length > 0
      ? await prisma.sportCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } })
      : [];
    const categoryNameMap = new Map(categoryRows.map((c) => [c.id, c.name]));

    const categories = [...categoryMap.values()]
      .map((entry) => ({
        categoryId: entry.categoryId,
        categoryName: entry.categoryId ? (categoryNameMap.get(entry.categoryId) ?? null) : "Uncategorized",
        matchesPlayed: entry.matchesPlayed,
        resultBreakdown: entry.resultBreakdown,
        stats: entry.stats,
      }))
      .sort((a, b) => b.matchesPlayed - a.matchesPlayed);

    ResponseHandler.success(res, "Data found.", { sportId, categories });
  },
);

export const getCareerByTeam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { sportId } = parseBody(byTeamStatsQuerySchema, req.query);
    const hidden = parseQueryEnum(req.query.hidden, hiddenQuerySchema) ?? "include";
    await assertActiveSport(sportId);

    const sideCte = buildSideCte(userId, sportId);

    const [hiddenRows, teamRows, statRows] = await Promise.all([
      prisma.playerTeamVisibility.findMany({
        where: { userId, sportId },
        select: { teamKey: true },
      }),
      prisma.$queryRaw<TeamRow[]>`
        WITH side AS ${sideCte}
        SELECT
          s.team_key AS "teamKey",
          MIN(s.team_org_id) AS "teamOrgId",
          MIN(s.team_name) AS "teamName",
          COUNT(*) AS "matchesPlayed",
          COUNT(*) FILTER (WHERE s.result = 'WIN'::"MatchResult") AS "winCount",
          COUNT(*) FILTER (WHERE s.result = 'LOSS'::"MatchResult") AS "lossCount",
          COUNT(*) FILTER (WHERE s.result = 'DRAW'::"MatchResult") AS "drawCount",
          COUNT(*) FILTER (WHERE s.result = 'TIE'::"MatchResult") AS "tieCount",
          COUNT(*) FILTER (WHERE s.result = 'NO_RESULT'::"MatchResult") AS "noResultCount"
        FROM side s
        WHERE s.team_key IS NOT NULL
        GROUP BY s.team_key
      `,
      prisma.$queryRaw<TeamStatRow[]>`
        WITH side AS ${sideCte}
        SELECT
          s.team_key AS "teamKey",
          fv.field_id AS "fieldId",
          f.name AS "fieldName",
          SUM(fv.value_number) AS "total"
        FROM side s
        JOIN player_match_field_values fv ON fv.player_match_id = s.match_id
        JOIN sport_fields f ON f.id = fv.field_id
        WHERE s.team_key IS NOT NULL AND f.type = 'NUMBER'::"FieldType"
        GROUP BY s.team_key, fv.field_id, f.name
      `,
    ]);

    const hiddenKeys = new Set(hiddenRows.map((r) => r.teamKey));

    const teamMap = new Map<
      string,
      { teamKey: string; teamOrgId: string | null; teamName: string | null; matchesPlayed: number; resultBreakdown: ResultBreakdown; stats: FieldStat[] }
    >();
    for (const row of teamRows) {
      teamMap.set(row.teamKey, {
        teamKey: row.teamKey,
        teamOrgId: row.teamOrgId,
        teamName: row.teamName,
        matchesPlayed: toNumber(row.matchesPlayed),
        resultBreakdown: {
          [MatchResult.WIN]: toNumber(row.winCount),
          [MatchResult.LOSS]: toNumber(row.lossCount),
          [MatchResult.DRAW]: toNumber(row.drawCount),
          [MatchResult.TIE]: toNumber(row.tieCount),
          [MatchResult.NO_RESULT]: toNumber(row.noResultCount),
        },
        stats: [],
      });
    }
    for (const row of statRows) {
      const entry = teamMap.get(row.teamKey);
      if (entry) entry.stats.push({ fieldId: row.fieldId, fieldName: row.fieldName, total: toNumber(row.total) });
    }

    const orgIds = [...teamMap.values()]
      .map((t) => t.teamOrgId)
      .filter((id): id is string => id !== null);
    const orgRows = orgIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } })
      : [];
    const orgNameMap = new Map(orgRows.map((o) => [o.id, o.name]));

    let teams = [...teamMap.values()]
      .map((t) => ({
        teamKey: t.teamKey,
        teamLabel: t.teamOrgId ? (orgNameMap.get(t.teamOrgId) ?? t.teamName ?? t.teamKey) : (t.teamName ?? t.teamKey),
        teamOrgId: t.teamOrgId,
        isHidden: hiddenKeys.has(t.teamKey),
        matchesPlayed: t.matchesPlayed,
        resultBreakdown: t.resultBreakdown,
        stats: t.stats,
      }))
      .sort((a, b) => b.matchesPlayed - a.matchesPlayed);

    if (hidden === "exclude") {
      teams = teams.filter((t) => !t.isHidden);
    }

    ResponseHandler.success(res, "Data found.", { sportId, hidden, teams });
  },
);

export const hideTeam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const body = parseBody(teamVisibilitySchema, req.body);
    await assertActiveSport(body.sportId);

    let teamLabel: string;
    if (body.teamOrgId) {
      const org = await prisma.user.findUnique({
        where: { id: body.teamOrgId },
        select: { id: true, name: true, role: true, isActive: true },
      });
      if (!org || org.role !== UserRole.organization || !org.isActive) {
        throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
          data: { teamOrgId: "Unknown, inactive, or not an organization" },
        });
      }
      teamLabel = org.name;
    } else if (body.teamName) {
      teamLabel = body.teamName;
    } else {
      throw new AppError(ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    const teamKey = teamKeyFor({ teamOrgId: body.teamOrgId, teamName: body.teamName });
    if (!teamKey) throw new AppError(ERROR_CODES.REQUIRED_FIELD_MISSING);

    await prisma.playerTeamVisibility.upsert({
      where: { userId_sportId_teamKey: { userId, sportId: body.sportId, teamKey } },
      update: { teamLabel },
      create: { userId, sportId: body.sportId, teamKey, teamLabel },
    });

    ResponseHandler.success(res, "Team hidden.", { teamKey });
  },
);

export const unhideTeam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const body = parseBody(teamVisibilitySchema, req.body);

    const teamKey = teamKeyFor({ teamOrgId: body.teamOrgId, teamName: body.teamName });
    if (!teamKey) throw new AppError(ERROR_CODES.REQUIRED_FIELD_MISSING);

    await prisma.playerTeamVisibility.deleteMany({
      where: { userId, sportId: body.sportId, teamKey },
    });

    ResponseHandler.success(res, "Team unhidden.", { teamKey });
  },
);