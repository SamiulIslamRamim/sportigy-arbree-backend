import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { organizationSearchQuerySchema } from "../../schemas/organization.schema";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../config/prisma";
import { UserRole } from "../../generated/prisma/enums";
import { ResponseHandler } from "../../utils/Responsehandler";


export const searchOrganisations = asyncHandler(async (req: Request, res: Response) => {
  const parsed = organizationSearchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
      data: parsed.error.flatten(),
    });
  }

  const { q="", limit } = parsed.data;
  const query = q.trim();

  const organizations = await prisma.user.findMany({
    where: {
      role: UserRole.organization,
      isActive: true,
      name: {
        ...(query.length > 0 && { contains: query, mode: "insensitive" }),
      },
    },
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true },
  });

  ResponseHandler.success(res, "Data found.", { organizations });
});
