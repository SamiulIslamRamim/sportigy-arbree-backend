import { Response } from "express";
import { prisma } from "../../config/prisma.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { fieldSectionQuerySchema, sportParamsSchema } from "../../schemas/sport.schema.js";
import { AuthenticatedRequest } from "../../types/auth.type.js";
import { AppError } from "../../utils/AppError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { parseParams, parseQueryEnum, requireUserId } from "../../utils/helper.js";
import { ResponseHandler } from "../../utils/Responsehandler.js";

export const getPlayerSportFields = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    requireUserId(req);
    const { sportId } = parseParams(sportParamsSchema, req.params);
    const section = parseQueryEnum(req.query.section, fieldSectionQuerySchema);

    const sport = await prisma.sport.findFirst({
      where: { id: sportId, isActive: true },
      select: { id: true },
    });
    if (!sport) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    const fields = await prisma.sportField.findMany({
      where: {
        sportId,
        isActive: true,
        ...(section !== undefined && { section }),
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        section: true,
        type: true,
        required: true,
        displayOrder: true,
        metricId: true,
        isComputed: true,
        formulaMultiplier: true,
        options: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          select: { id: true, label: true, value: true },
        },
        metric: { select: { id: true, name: true, slug: true } },
        formulaComponents: {
          select: {
            role: true,
            sourceField: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    ResponseHandler.success(res, "Data found.", { fields });
  },
);