import { Response } from "express";
import { ApprovalStatus, FieldSection, FieldType, FormulaRole, MatchResult, Prisma, UserRole } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.type.js";
import { parseBody, parseParams, parseQueryEnum, requireUserId, teamKeyFor } from "../../utils/helper.js";
import { byTeamStatsQuerySchema, hiddenQuerySchema, sportQuerySchema, teamVisibilitySchema } from "../../schemas/career.schema.js";
import { ResponseHandler } from "../../utils/Responsehandler.js";
import {
  CareerFieldConfig,
  CareerFieldOutput,
  CareerMetricConfig,
  CareerMetricOutput,
  CategoryStatRow,
  CountValue,
  NumericValue,
  ResultBreakdown,
  TeamRow,
  TeamStatRow,
} from "../../types/career.type.js";
import { sportParamsSchema } from "../../schemas/sport.schema.js";

const UNCATEGORIZED_KEY = "__uncategorized__";
const OTHER_METRIC_KEY = "__other__";

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

const assertActiveSport = async (sportId: string): Promise<{ id: string }> => {
  const sport = await prisma.sport.findUnique({
    where: { id: sportId },
    select: { id: true, isActive: true },
  });
  if (!sport || !sport.isActive) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
  return sport;
};

/**
 * Loads the sport's stat-bearing MATCH NUMBER fields (raw inputs + computed)
 * together with its ordered metrics. Loaded once per request so computed-field
 * post-processing needs no extra database round trips.
 */
const fetchSportFieldConfig = async (
  sportId: string,
): Promise<{ fields: CareerFieldConfig[]; metrics: CareerMetricConfig[] }> => {
  const [raw, metrics] = await Promise.all([
    prisma.sportField.findMany({
      where: { sportId, section: FieldSection.MATCH, type: FieldType.NUMBER },
      select: {
        id: true,
        name: true,
        slug: true,
        displayOrder: true,
        isComputed: true,
        metricId: true,
        formulaMultiplier: true,
        formulaComponents: { select: { sourceFieldId: true, role: true } },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.sportMetric.findMany({
      where: { sportId },
      select: { id: true, name: true, displayOrder: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const fields: CareerFieldConfig[] = raw.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    displayOrder: f.displayOrder,
    isComputed: f.isComputed,
    metricId: f.metricId,
    formulaMultiplier:
      f.formulaMultiplier !== null ? toNumber(f.formulaMultiplier) : null,
    numeratorIds: f.formulaComponents
      .filter((c) => c.role === FormulaRole.NUMERATOR)
      .map((c) => c.sourceFieldId),
    denominatorIds: f.formulaComponents
      .filter((c) => c.role === FormulaRole.DENOMINATOR)
      .map((c) => c.sourceFieldId),
  }));

  const metricConfigs: CareerMetricConfig[] = metrics.map((m) => ({
    id: m.id,
    name: m.name,
    displayOrder: m.displayOrder,
  }));

  return { fields, metrics: metricConfigs };
};

const sumSourceIds = (ids: string[], statSum: Map<string, number>): number => {
  let total = 0;
  let anyFound = false;
  for (const id of ids) {
    const v = statSum.get(id);
    if (v !== undefined) {
      total += v;
      anyFound = true;
    }
  }
  return anyFound ? total : 0;
};

/**
 * Sum-first, divide-once evaluation. Given a per-group SUM(value_number) map
 * (the exact output Phase 5 already produces), buckets every stat-bearing
 * field by metric and computes computed fields from those raw sums — no
 * additional aggregate query needed.
 */
const buildMetrics = (
  statSum: Map<string, number>,
  fields: CareerFieldConfig[],
  metrics: CareerMetricConfig[],
): CareerMetricOutput[] => {
  const hasOther = fields.some((f) => f.metricId === null);
  const buckets: Array<{ key: string | null; label: string }> = [
    ...metrics.map((m) => ({ key: m.id as string | null, label: m.name })),
    ...(hasOther ? [{ key: null as string | null, label: "Other" }] : []),
  ];

  const metricKeyOf = (f: CareerFieldConfig): string | null =>
    f.metricId ?? OTHER_METRIC_KEY;

  // Track which metric buckets actually exist among the fields.
  const presentMetricIds = new Set(fields.map(metricKeyOf));

  const outputs: CareerMetricOutput[] = [];

  for (const bucket of buckets) {
    const bucketKey = bucket.key ?? OTHER_METRIC_KEY;
    if (!presentMetricIds.has(bucketKey)) continue;

    const bucketFields = fields
      .filter((f) => (f.metricId ?? OTHER_METRIC_KEY) === bucketKey)
      .sort(
        (a, b) =>
          a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
      );

    const fieldOutputs: CareerFieldOutput[] = [];

    for (const f of bucketFields) {
      if (!f.isComputed) {
        const total = statSum.get(f.id);
        // A raw field with no data in this group is omitted; computed fields
        // are always emitted (with null when the denominator is zero/missing).
        if (total === undefined) continue;
        fieldOutputs.push({
          fieldId: f.id,
          name: f.name,
          slug: f.slug,
          metricId: f.metricId,
          isComputed: false,
          total,
        });
        continue;
      }

      const numerator = sumSourceIds(f.numeratorIds, statSum);
      const denominator = sumSourceIds(f.denominatorIds, statSum);
      const value =
        denominator === 0 || Number.isNaN(denominator)
          ? null
          : round2((numerator / denominator) * (f.formulaMultiplier ?? 1));
      fieldOutputs.push({
        fieldId: f.id,
        name: f.name,
        slug: f.slug,
        metricId: f.metricId,
        isComputed: true,
        value,
      });
    }

    outputs.push({
      metric: bucket.label,
      metricId: bucket.key,
      fields: fieldOutputs,
    });
  }

  return outputs;
};

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

// Keep the team_key CASE in sync with helper.ts teamKeyFor()/normalizeTeamName().
const buildSideCte = (userId: string, sportId: string, categoryId?: string): Prisma.Sql =>
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
    WHERE pm.player_id = ${userId}::uuid
      AND pm.sport_id = ${sportId}::uuid
      AND pm.status = 'APPROVED'::"ApprovalStatus"
      AND pm.player_side IS NOT NULL
      ${categoryId ? Prisma.sql`AND pm.sport_category_id = ${categoryId}::uuid` : Prisma.empty}
  )`;

export const getCareerStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { sportId } = parseBody(sportQuerySchema, req.query);
    await assertActiveSport(sportId);

    const [grouped, statRows, fieldConfig] = await Promise.all([
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
        WHERE pm.player_id = ${userId}::uuid
          AND pm.sport_id = ${sportId}::uuid
          AND pm.status = 'APPROVED'::"ApprovalStatus"
          AND f.type = 'NUMBER'::"FieldType"
          AND f.is_computed = false
        GROUP BY pm.sport_category_id, fv.field_id, f.name
      `,
      fetchSportFieldConfig(sportId),
    ]);

    const categoryMap = new Map<
      string,
      {
        categoryId: string | null;
        matchesPlayed: number;
        resultBreakdown: ResultBreakdown;
        statSum: Map<string, number>;
      }
    >();
    for (const row of grouped) {
      const key = row.sportCategoryId ?? UNCATEGORIZED_KEY;
      let entry = categoryMap.get(key);
      if (!entry) {
        entry = {
          categoryId: row.sportCategoryId,
          matchesPlayed: 0,
          resultBreakdown: emptyBreakdown(),
          statSum: new Map(),
        };
        categoryMap.set(key, entry);
      }
      entry.matchesPlayed += row._count._all;
      entry.resultBreakdown[row.result] += row._count._all;
    }
    for (const row of statRows) {
      const entry = categoryMap.get(row.categoryId ?? UNCATEGORIZED_KEY);
      if (entry) entry.statSum.set(row.fieldId, toNumber(row.total));
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
        metrics: buildMetrics(entry.statSum, fieldConfig.fields, fieldConfig.metrics),
      }))
      .sort((a, b) => b.matchesPlayed - a.matchesPlayed);

    ResponseHandler.success(res, "Data found.", { sportId, categories });
  },
);

export const getCareerByTeam = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    // const { sportId } = parseBody(byTeamStatsQuerySchema, req.query);
    const { sportId, categoryId } = parseBody(byTeamStatsQuerySchema, req.query);
    const sideCte = buildSideCte(userId, sportId, categoryId);
    const hidden = parseQueryEnum(req.query.hidden, hiddenQuerySchema) ?? "include";
    await assertActiveSport(sportId);


    const [hiddenRows, teamRows, statRows, fieldConfig] = await Promise.all([
      prisma.playerTeamVisibility.findMany({
        where: { userId, sportId },
        select: { teamKey: true },
      }),
      prisma.$queryRaw<TeamRow[]>`
        WITH side AS ${sideCte}
        SELECT
          s.team_key AS "teamKey",
          MIN(s.team_org_id::text)::uuid AS "teamOrgId",
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
        WHERE s.team_key IS NOT NULL AND f.type = 'NUMBER'::"FieldType" AND f.is_computed = false
        GROUP BY s.team_key, fv.field_id, f.name
      `,
      fetchSportFieldConfig(sportId),
    ]);

    const hiddenKeys = new Set(hiddenRows.map((r) => r.teamKey));

    const teamMap = new Map<
      string,
      {
        teamKey: string;
        teamOrgId: string | null;
        teamName: string | null;
        matchesPlayed: number;
        resultBreakdown: ResultBreakdown;
        statSum: Map<string, number>;
      }
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
        statSum: new Map(),
      });
    }
    for (const row of statRows) {
      const entry = teamMap.get(row.teamKey);
      if (entry) entry.statSum.set(row.fieldId, toNumber(row.total));
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
        metrics: buildMetrics(t.statSum, fieldConfig.fields, fieldConfig.metrics),
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


export const getSportCategories = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    await assertActiveSport(sportId);

    const categories = await prisma.sportCategory.findMany({
      where: { sportId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    ResponseHandler.success(res, "Data found.", { categories });
  },
);