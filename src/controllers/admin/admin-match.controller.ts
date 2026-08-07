import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthenticatedRequest } from "../../types/auth.type";
import { parseBody, parseParams, parseQueryEnum } from "../../utils/helper";
import { matchParamsSchema, matchStatusQuerySchema, rejectMatchSchema } from "../../schemas/match.schema";
import { prisma } from "../../config/prisma";
import { ResponseHandler } from "../../utils/Responsehandler";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";
import { ApprovalStatus } from "../../generated/prisma/enums";

const MATCH_DETAIL_INCLUDE = {
  sport: { select: { id: true, name: true, slug: true } },
  sportCategory: { select: { id: true, name: true, slug: true } },
  user: { select: { id: true, name: true, username: true, email: true } },
  values: {
    include: {
      field: { select: { id: true, name: true, slug: true, type: true } },
      option: { select: { id: true, label: true, value: true } },
    },
  },
} as const;

export const listMatchSubmissions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const status = parseQueryEnum(req.query.status, matchStatusQuerySchema);

    const submissions = await prisma.playerMatch.findMany({
      where: { ...(status !== undefined && { status }) },
      orderBy: { createdAt: "desc" },
      include: {
        sport: { select: { id: true, name: true, slug: true } },
        sportCategory: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, username: true } },
      },
    });

    ResponseHandler.success(res, "Data found.", { submissions });
  },
);

export const getMatchSubmission = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = parseParams(matchParamsSchema, req.params);

    const submission = await prisma.playerMatch.findUnique({
      where: { id: matchId },
      include: MATCH_DETAIL_INCLUDE,
    });
    if (!submission) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    ResponseHandler.success(res, "Data found.", { submission });
  },
);

export const approveMatch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = parseParams(matchParamsSchema, req.params);
    const adminId = req.user?.id;
    if (!adminId) throw new AppError(ERROR_CODES.UNAUTHORIZED);

    const existing = await prisma.playerMatch.findUnique({
      where: { id: matchId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    if (existing.status === ApprovalStatus.APPROVED) {
      throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);
    }

    const submission = await prisma.playerMatch.update({
      where: { id: matchId },
      data: {
        status: ApprovalStatus.APPROVED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectReason: null,
      },
      include: MATCH_DETAIL_INCLUDE,
    });

    ResponseHandler.success(res, "Match approved.", { submission });
  },
);

export const rejectMatch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = parseParams(matchParamsSchema, req.params);
    const body = parseBody(rejectMatchSchema, req.body);
    const adminId = req.user?.id;
    if (!adminId) throw new AppError(ERROR_CODES.UNAUTHORIZED);

    const existing = await prisma.playerMatch.findUnique({
      where: { id: matchId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    if (existing.status === ApprovalStatus.REJECTED) {
      throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);
    }

    const submission = await prisma.playerMatch.update({
      where: { id: matchId },
      data: {
        status: ApprovalStatus.REJECTED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectReason: body.reason,
      },
      include: MATCH_DETAIL_INCLUDE,
    });

    ResponseHandler.success(res, "Match rejected.", { submission });
  },
);