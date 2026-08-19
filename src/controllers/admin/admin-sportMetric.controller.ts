import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createSportMetricSchema,
  metricIdParamSchema,
  metricParamsSchema,
  sportParamsSchema,
  updateSportMetricSchema,
} from "../../schemas/sport.schema";
import { assertNonEmptyUpdate, assertSportExists, parseBody, parseParams, slugify } from "../../utils/helper";
import { prisma } from "../../config/prisma";
import { ResponseHandler } from "../../utils/Responsehandler";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";

export const getSportMetrics = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    await assertSportExists(sportId);

    const metrics = await prisma.sportMetric.findMany({
      where: { sportId },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    ResponseHandler.success(res, "Data found.", { metrics });
  },
);

export const createSportMetric = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    const body = parseBody(createSportMetricSchema, req.body);
    await assertSportExists(sportId);

    const name = body.name.trim();
    const slug = body.slug?.trim() ?? slugify(name);

    const existing = await prisma.sportMetric.findUnique({
      where: { sportId_slug: { sportId, slug } },
    });
    if (existing) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);

    const metric = await prisma.sportMetric.create({
      data: {
        sportId,
        name,
        slug,
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });

    ResponseHandler.success(res, "Metric created successfully.", { metric }, 201);
  },
);

export const updateSportMetric = asyncHandler(
  async (req: Request, res: Response) => {
    const { metricId } = parseParams(metricIdParamSchema, req.params);
    const body = parseBody(updateSportMetricSchema, req.body);
    assertNonEmptyUpdate(body);

    const existing = await prisma.sportMetric.findUnique({ where: { id: metricId } });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    const name = body.name?.trim() ?? existing.name;
    const slug =
      body.slug?.trim() ?? (body.name !== undefined ? slugify(name) : existing.slug);

    if (body.name !== undefined || body.slug !== undefined) {
      const conflict = await prisma.sportMetric.findFirst({
        where: { AND: [{ id: { not: metricId } }, { sportId: existing.sportId }, { slug }] },
      });
      if (conflict) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
    }

    const metric = await prisma.sportMetric.update({
      where: { id: metricId },
      data: {
        ...(body.name !== undefined && { name }),
        ...(body.slug !== undefined && { slug }),
        ...(body.name !== undefined && body.slug === undefined && { slug: slugify(name) }),
        ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    ResponseHandler.success(res, "Metric updated successfully.", { metric });
  },
);

export const deleteSportMetric = asyncHandler(
  async (req: Request, res: Response) => {
    const { metricId } = parseParams(metricIdParamSchema, req.params);

    const existing = await prisma.sportMetric.findUnique({ where: { id: metricId } });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    if (!existing.isActive) throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);

    // Detach any fields assigned to this metric (metricId is nullable + SetNull).
    await prisma.$transaction([
      prisma.sportField.updateMany({
        where: { metricId },
        data: { metricId: null },
      }),
      prisma.sportMetric.update({
        where: { id: metricId },
        data: { isActive: false },
      }),
    ]);

    ResponseHandler.success(res, "Metric deleted successfully.", { id: metricId });
  },
);
