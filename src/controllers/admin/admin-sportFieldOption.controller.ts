import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ERROR_CODES } from "../../constants/errorCodes";
import {
  createSportFieldOptionSchema,
  createSportFieldSchema,
  fieldIdParamSchema,
  fieldParamsSchema,
  fieldSectionQuerySchema,
  optionParamsSchema,
  sportParamsSchema,
  updateSportFieldOptionSchema,
  updateSportFieldSchema,
} from "../../schemas/sport.schema";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { ResponseHandler } from "../../utils/Responsehandler";
import { FieldType } from "../../generated/prisma/enums";
import {
  assertFieldExists,
  assertNonEmptyUpdate,
  assertSportExists,
  parseBody,
  parseParams,
  parseQueryEnum,
  slugify,
} from "../../utils/helper";


export const getFieldOptions = asyncHandler(
  async (req: Request, res: Response) => {
    const { fieldId } = parseParams(fieldIdParamSchema, req.params);
    await assertFieldExists(fieldId);

    const options = await prisma.sportFieldOption.findMany({
      where: { fieldId },
      orderBy: { createdAt: "asc" },
    });

    ResponseHandler.success(res, "Data found.", { options });
  },
);

export const createFieldOption = asyncHandler(
  async (req: Request, res: Response) => {
    const { fieldId } = parseParams(fieldIdParamSchema, req.params);
    const body = parseBody(createSportFieldOptionSchema, req.body);

    const field = await prisma.sportField.findUnique({
      where: { id: fieldId },
    });
    if (!field) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    if (
      field.type !== FieldType.SELECT &&
      field.type !== FieldType.MULTI_SELECT
    ) {
      throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT);
    }

    const label = body.label.trim();
    const value = body.value?.trim() ?? slugify(label);

    const existing = await prisma.sportFieldOption.findUnique({
      where: { fieldId_value: { fieldId, value } },
    });
    if (existing) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);

    const option = await prisma.sportFieldOption.create({
      data: {
        fieldId,
        label,
        value,
        isDefault: body.isDefault ?? false,
        isActive: body.isActive ?? true,
      },
    });

    ResponseHandler.success(
      res,
      "Option created successfully.",
      { option },
      201,
    );
  },
);

export const updateFieldOption = asyncHandler(
  async (req: Request, res: Response) => {
    const { fieldId, optionId } = parseParams(optionParamsSchema, req.params);
    const body = parseBody(updateSportFieldOptionSchema, req.body);
    assertNonEmptyUpdate(body);

    const existing = await prisma.sportFieldOption.findFirst({
      where: { id: optionId, fieldId },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    const value = body.value?.trim() ?? slugify(body.label!);

    if (body.value !== undefined) {
      const conflict = await prisma.sportFieldOption.findFirst({
        where: { AND: [{ id: { not: optionId } }, { fieldId }, { value }] },
      });
      if (conflict) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
    }

    const option = await prisma.sportFieldOption.update({
      where: { id: optionId },
      data: {
        ...(body.label !== undefined && { label: body.label.trim() }),
        ...(body.value !== undefined && { value }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    ResponseHandler.success(res, "Option updated successfully.", { option });
  },
);

export const deleteFieldOption = asyncHandler(
  async (req: Request, res: Response) => {
    const { fieldId, optionId } = parseParams(optionParamsSchema, req.params);

    const existing = await prisma.sportFieldOption.findFirst({
      where: { id: optionId, fieldId },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    if (!existing.isActive)
      throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);

    await prisma.sportFieldOption.update({
      where: { id: optionId },
      data: { isActive: false },
    });

    ResponseHandler.success(res, "Option deleted successfully.", {
      id: optionId,
    });
  },
);
