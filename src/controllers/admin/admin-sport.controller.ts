import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../config/prisma.js";
import { ResponseHandler } from "../../utils/Responsehandler.js";
import { assertNonEmptyUpdate, parseBody, parseParams, slugify } from "../../utils/helper.js";
import { createSportSchema, sportParamsSchema, updateSportSchema } from "../../schemas/sport.schema.js";
import { AppError } from "../../utils/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";

export const getSports = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.query;
  const where = isActive === undefined ? {} : { isActive: isActive === "true" };

  const sports = await prisma.sport.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      // _count: { select: { categories: true, fields: true } },
      _count: { select: { categories: true } },
    },
  });

  ResponseHandler.success(res, "Data found.", { sports });
});

export const getSportById = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);

    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      include: {
        categories: { orderBy: { name: "asc" } },
        metrics: { orderBy: [{ displayOrder: "asc" }, { name: "asc" }] },
        fields: {
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          include: {
            options: { orderBy: { createdAt: "asc" } },
            metric: { select: { id: true, name: true, slug: true } },
            formulaComponents: {
              include: { sourceField: { select: { id: true, name: true, slug: true } } },
            },
          },
        },
      },
    });
    if (!sport) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    ResponseHandler.success(res, "Data found.", { sport });
  },
);

export const createSport = asyncHandler(async (req: Request, res: Response) => {
  const body = parseBody(createSportSchema, req.body);

  const name = body.name.trim();
  const slug = body.slug?.trim() ?? slugify(name);

  const existing = await prisma.sport.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);

  const sport = await prisma.sport.create({
    data: {
      name,
      slug,
      description: body.description ?? null,
      isActive: body.isActive ?? true,
    },
  });

  ResponseHandler.success(res, "Sport created successfully.", { sport }, 201);
});

export const updateSport = asyncHandler(async (req: Request, res: Response) => {
  const { sportId } = parseParams(sportParamsSchema, req.params);
  const body = parseBody(updateSportSchema, req.body);
  assertNonEmptyUpdate(body);

  const existing = await prisma.sport.findUnique({ where: { id: sportId } });
  if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

  const name = body.name?.trim() ?? existing.name;
  const slug =
    body.slug?.trim() ??
    (body.name !== undefined ? slugify(name) : existing.slug);

  if (body.name !== undefined || body.slug !== undefined) {
    const conflict = await prisma.sport.findFirst({
      where: { AND: [{ NOT: { id: sportId } }, { OR: [{ name }, { slug }] }] },
    });
    if (conflict) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
  }

  const sport = await prisma.sport.update({
    where: { id: sportId },
    data: {
      ...(body.name !== undefined && { name }),
      ...(body.slug !== undefined && { slug }),
      ...(body.name !== undefined &&
        body.slug === undefined && { slug: slugify(name) }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  ResponseHandler.success(res, "Sport updated successfully.", { sport });
});

export const deleteSport = asyncHandler(async (req: Request, res: Response) => {
  const { sportId } = parseParams(sportParamsSchema, req.params);

  const existing = await prisma.sport.findUnique({ where: { id: sportId } });
  if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
  if (!existing.isActive) throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);

  await prisma.sport.update({
    where: { id: sportId },
    data: { isActive: false },
  });

  ResponseHandler.success(res, "Sport deleted successfully.", { id: sportId });
});