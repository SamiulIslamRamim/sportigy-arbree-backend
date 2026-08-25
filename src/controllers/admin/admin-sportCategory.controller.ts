import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { categoryParamsSchema, createSportCategorySchema, sportParamsSchema, updateSportCategorySchema } from "../../schemas/sport.schema";
import { assertNonEmptyUpdate, assertSportExists, parseBody, parseParams, slugify } from "../../utils/helper";
import { prisma } from "../../config/prisma.js";
import { ResponseHandler } from "../../utils/Responsehandler";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";


export const getSportCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    await assertSportExists(sportId);

    const categories = await prisma.sportCategory.findMany({
      where: { sportId },
      orderBy: { name: "asc" },
    });

    ResponseHandler.success(res, "Data found.", { categories });
  },
);

export const createSportCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    const body = parseBody(createSportCategorySchema, req.body);
    await assertSportExists(sportId);

    const name = body.name.trim();
    const slug = body.slug?.trim() ?? slugify(name);

    const existing = await prisma.sportCategory.findUnique({
      where: { sportId_slug: { sportId, slug } },
    });
    if (existing) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);

    const category = await prisma.sportCategory.create({
      data: {
        sportId,
        name,
        slug,
        description: body.description ?? null,
        isActive: body.isActive ?? true,
      },
    });

    ResponseHandler.success(
      res,
      "Category created successfully.",
      { category },
      201,
    );
  },
);

export const getSportCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, categoryId } = parseParams(
      categoryParamsSchema,
      req.params,
    );

    const category = await prisma.sportCategory.findFirst({
      where: { id: categoryId, sportId },
    });
    if (!category) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    ResponseHandler.success(res, "Data found.", { category });
  },
);

export const updateSportCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, categoryId } = parseParams(
      categoryParamsSchema,
      req.params,
    );
    const body = parseBody(updateSportCategorySchema, req.body);
    assertNonEmptyUpdate(body);

    const existing = await prisma.sportCategory.findFirst({
      where: { id: categoryId, sportId },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    const name = body.name?.trim() ?? existing.name;
    const slug =
      body.slug?.trim() ??
      (body.name !== undefined ? slugify(name) : existing.slug);

    if (body.name !== undefined || body.slug !== undefined) {
      const conflict = await prisma.sportCategory.findFirst({
        where: { AND: [{ id: { not: categoryId } }, { sportId }, { slug }] },
      });
      if (conflict) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
    }

    const category = await prisma.sportCategory.update({
      where: { id: categoryId },
      data: {
        ...(body.name !== undefined && { name }),
        ...(body.slug !== undefined && { slug }),
        ...(body.name !== undefined &&
          body.slug === undefined && { slug: slugify(name) }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    ResponseHandler.success(res, "Category updated successfully.", {
      category,
    });
  },
);

export const deleteSportCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, categoryId } = parseParams(
      categoryParamsSchema,
      req.params,
    );

    const existing = await prisma.sportCategory.findFirst({
      where: { id: categoryId, sportId },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    if (!existing.isActive)
      throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);

    await prisma.sportCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    });

    ResponseHandler.success(res, "Category deleted successfully.", {
      id: categoryId,
    });
  },
);