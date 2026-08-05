import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createSportFieldSchema,
  fieldParamsSchema,
  fieldSectionQuerySchema,
  sportParamsSchema,
  updateSportFieldSchema,
} from "../../schemas/sport.schema";
import {
  assertNonEmptyUpdate,
  assertSportExists,
  parseBody,
  parseParams,
  parseQueryEnum,
  slugify,
} from "../../utils/helper";
import { prisma } from "../../config/prisma";
import { ResponseHandler } from "../../utils/Responsehandler";
import { FieldType } from "../../generated/prisma/enums";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";

export const getSportFields = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    await assertSportExists(sportId);

    const section = parseQueryEnum(req.query.section, fieldSectionQuerySchema);

    const fields = await prisma.sportField.findMany({
      where: {
        sportId,
        ...(section !== undefined && { section }),
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      include: { options: { orderBy: { createdAt: "asc" } } },
    });

    ResponseHandler.success(res, "Data found.", { fields });
  },
);

export const createSportField = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId } = parseParams(sportParamsSchema, req.params);
    const body = parseBody(createSportFieldSchema, req.body);
    await assertSportExists(sportId);

    const name = body.name.trim();
    const slug = body.slug?.trim() ?? slugify(name);
    const { section, type } = body;

    const hasOptions = (body.options?.length ?? 0) > 0;
    const isSelectType =
      type === FieldType.SELECT || type === FieldType.MULTI_SELECT;
    if (hasOptions && !isSelectType) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT);
    }

    const existing = await prisma.sportField.findUnique({
      where: { sportId_section_slug: { sportId, section, slug } },
    });
    if (existing) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);

    const optionValues = (body.options ?? []).map(
      (o) => o.value?.trim() ?? slugify(o.label),
    );
    if (new Set(optionValues).size !== optionValues.length) {
      throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
    }

    const field = await prisma.sportField.create({
      data: {
        sportId,
        name,
        slug,
        section,
        type,
        description: body.description ?? null,
        required: body.required ?? false,
        searchable: body.searchable ?? true,
        filterable: body.filterable ?? true,
        sortable: body.sortable ?? false,
        displayOrder: body.displayOrder ?? 0,
        isActive: body.isActive ?? true,
        ...(hasOptions && {
          options: {
            create: (body.options ?? []).map((opt) => ({
              label: opt.label.trim(),
              value: opt.value?.trim() ?? slugify(opt.label),
              isDefault: opt.isDefault ?? false,
              isActive: opt.isActive ?? true,
            })),
          },
        }),
      },
      include: { options: { orderBy: { createdAt: "asc" } } },
    });

    ResponseHandler.success(res, "Field created successfully.", { field }, 201);
  },
);

export const getSportFieldById = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, fieldId } = parseParams(fieldParamsSchema, req.params);

    const field = await prisma.sportField.findFirst({
      where: { id: fieldId, sportId },
      include: { options: { orderBy: { createdAt: "asc" } } },
    });
    if (!field) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    ResponseHandler.success(res, "Data found.", { field });
  },
);

export const updateSportField = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, fieldId } = parseParams(fieldParamsSchema, req.params);
    const body = parseBody(updateSportFieldSchema, req.body);
    assertNonEmptyUpdate(body);

    const existing = await prisma.sportField.findFirst({
      where: { id: fieldId, sportId },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    const name = body.name?.trim() ?? existing.name;
    const slug =
      body.slug?.trim() ??
      (body.name !== undefined ? slugify(name) : existing.slug);
    const section = body.section ?? existing.section;

    if (
      body.name !== undefined ||
      body.slug !== undefined ||
      body.section !== undefined
    ) {
      const conflict = await prisma.sportField.findFirst({
        where: {
          AND: [{ id: { not: fieldId } }, { sportId }, { section }, { slug }],
        },
      });
      if (conflict) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
    }

    const field = await prisma.sportField.update({
      where: { id: fieldId },
      data: {
        ...(body.name !== undefined && { name }),
        ...(body.slug !== undefined && { slug }),
        ...(body.name !== undefined &&
          body.slug === undefined && { slug: slugify(name) }),
        ...(body.section !== undefined && { section }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.required !== undefined && { required: body.required }),
        ...(body.searchable !== undefined && { searchable: body.searchable }),
        ...(body.filterable !== undefined && { filterable: body.filterable }),
        ...(body.sortable !== undefined && { sortable: body.sortable }),
        ...(body.displayOrder !== undefined && {
          displayOrder: body.displayOrder,
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    ResponseHandler.success(res, "Field updated successfully.", { field });
  },
);

export const deleteSportField = asyncHandler(
  async (req: Request, res: Response) => {
    const { sportId, fieldId } = parseParams(fieldParamsSchema, req.params);

    const existing = await prisma.sportField.findFirst({
      where: { id: fieldId, sportId },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    if (!existing.isActive)
      throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);

    await prisma.sportField.update({
      where: { id: fieldId },
      data: { isActive: false },
    });

    ResponseHandler.success(res, "Field deleted successfully.", {
      id: fieldId,
    });
  },
);
