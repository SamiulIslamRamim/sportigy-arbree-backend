import { Response } from "express";
import { AuthenticatedRequest } from "../../types/auth.type";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../config/prisma";
import { ResponseHandler } from "../../utils/Responsehandler";
import { assertNonEmptyUpdate, fetchPlayerMatches, parseBody, parseParams, requireUserId, validateMatchValues } from "../../utils/helper";
import { createMatchSchema, matchParamsSchema, updateMatchSchema } from "../../schemas/match.schema";
import { ApprovalStatus } from "../../generated/prisma/client";


export const createMatch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const body = parseBody(createMatchSchema, req.body);

    const submission = await prisma.$transaction(async (tx) => {
      const sport = await tx.sport.findUnique({
        where: { id: body.sportId },
        select: { id: true, isActive: true },
      });
      if (!sport || !sport.isActive) {
        throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
      }

      if (body.sportCategoryId !== undefined && body.sportCategoryId !== null) {
        const category = await tx.sportCategory.findFirst({
          where: { id: body.sportCategoryId, sportId: body.sportId },
          select: { id: true },
        });
        if (!category) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
      }

      const values = body.values ?? [];
      const validated = await validateMatchValues(tx, body.sportId, values);

      const created = await tx.playerMatch.create({
        data: {
          userId,
          sportId: body.sportId,
          ...(body.sportCategoryId !== undefined && { sportCategoryId: body.sportCategoryId }),
          ...(body.title !== undefined && { title: body.title }),
          ...(body.tournament !== undefined && { tournament: body.tournament }),
          ...(body.matchType !== undefined && { matchType: body.matchType }),
          ...(body.venue !== undefined && { venue: body.venue }),
          ...(body.homeTeam !== undefined && { homeTeam: body.homeTeam }),
          ...(body.awayTeam !== undefined && { awayTeam: body.awayTeam }),
          matchDate: body.matchDate,
          result: body.result,
          ...(body.playerTeam !== undefined && { playerTeam: body.playerTeam }),
          ...(body.isCaptain !== undefined && { isCaptain: body.isCaptain }),
          ...(body.isSubstitute !== undefined && { isSubstitute: body.isSubstitute }),
          ...(body.minutesPlayed !== undefined && { minutesPlayed: body.minutesPlayed }),
          ...(body.notes !== undefined && { notes: body.notes }),
          ...(validated.length > 0 && { values: { create: validated } }),
        },
        include: {
          values: {
            include: {
              field: { select: { id: true, name: true, slug: true, type: true } },
              option: { select: { id: true, label: true, value: true } },
            },
          },
        },
      });

      return created;
    });

    ResponseHandler.success(res, "Match submitted for approval.", { submission }, 201);
  },
);

export const listMatches = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const matches = await fetchPlayerMatches(userId);
    ResponseHandler.success(res, "Data found.", { matches });
  },
);

export const listApprovedMatches = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const matches = await fetchPlayerMatches(userId, ApprovalStatus.APPROVED);
    ResponseHandler.success(res, "Data found.", { matches });
  },
);

export const listPendingMatches = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const matches = await fetchPlayerMatches(userId, ApprovalStatus.PENDING);
    ResponseHandler.success(res, "Data found.", { matches });
  },
);

export const listRejectedMatches = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const matches = await fetchPlayerMatches(userId, ApprovalStatus.REJECTED);
    ResponseHandler.success(res, "Data found.", { matches });
  },
);

export const getMatch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { matchId } = parseParams(matchParamsSchema, req.params);

    const match = await prisma.playerMatch.findFirst({
      where: { id: matchId, userId },
      include: {
        sport: { select: { id: true, name: true, slug: true } },
        sportCategory: { select: { id: true, name: true, slug: true } },
        values: {
          include: {
            field: { select: { id: true, name: true, slug: true, type: true } },
            option: { select: { id: true, label: true, value: true } },
          },
        },
      },
    });
    if (!match) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    ResponseHandler.success(res, "Data found.", { match });
  },
);

export const updateMatch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { matchId } = parseParams(matchParamsSchema, req.params);
    const body = parseBody(updateMatchSchema, req.body);
    assertNonEmptyUpdate(body);

    const submission = await prisma.$transaction(async (tx) => {
      const existing = await tx.playerMatch.findFirst({
        where: { id: matchId, userId },
      });
      if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
      if (
  existing.status !== ApprovalStatus.PENDING &&
  existing.status !== ApprovalStatus.APPROVED
) {
  throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);
}

      if (body.sportCategoryId !== undefined && body.sportCategoryId !== null) {
        const category = await tx.sportCategory.findFirst({
          where: { id: body.sportCategoryId, sportId: existing.sportId },
          select: { id: true },
        });
        if (!category) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
      }

      const updated = await tx.playerMatch.update({
        where: { id: existing.id },
        data: {
            status: ApprovalStatus.PENDING,
          ...(body.sportCategoryId !== undefined && { sportCategoryId: body.sportCategoryId }),
          ...(body.title !== undefined && { title: body.title }),
          ...(body.tournament !== undefined && { tournament: body.tournament }),
          ...(body.matchType !== undefined && { matchType: body.matchType }),
          ...(body.venue !== undefined && { venue: body.venue }),
          ...(body.homeTeam !== undefined && { homeTeam: body.homeTeam }),
          ...(body.awayTeam !== undefined && { awayTeam: body.awayTeam }),
          ...(body.matchDate !== undefined && { matchDate: body.matchDate }),
          ...(body.result !== undefined && { result: body.result }),
          ...(body.playerTeam !== undefined && { playerTeam: body.playerTeam }),
          ...(body.isCaptain !== undefined && { isCaptain: body.isCaptain }),
          ...(body.isSubstitute !== undefined && { isSubstitute: body.isSubstitute }),
          ...(body.minutesPlayed !== undefined && { minutesPlayed: body.minutesPlayed }),
          ...(body.notes !== undefined && { notes: body.notes }),
        },
      });

      if (body.values !== undefined) {
        const validated = await validateMatchValues(tx, existing.sportId, body.values);
        await tx.playerMatchFieldValue.deleteMany({ where: { playerMatchId: existing.id } });
        if (validated.length > 0) {
          await tx.playerMatchFieldValue.createMany({
            data: validated.map((r) => ({ ...r, playerMatchId: existing.id })),
          });
        }
      }

      return tx.playerMatch.findUniqueOrThrow({
        where: { id: existing.id },
        include: {
          values: {
            include: {
              field: { select: { id: true, name: true, slug: true, type: true } },
              option: { select: { id: true, label: true, value: true } },
            },
          },
        },
      });
    });

    ResponseHandler.success(res, "Match updated successfully.", { submission });
  },
);

export const deleteMatch = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { matchId } = parseParams(matchParamsSchema, req.params);

    const existing = await prisma.playerMatch.findFirst({
      where: { id: matchId, userId },
      select: { id: true, status: true },
    });
    if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    if (existing.status !== ApprovalStatus.PENDING) {
      throw new AppError(ERROR_CODES.OPERATION_NOT_ALLOWED);
    }

    await prisma.playerMatch.delete({ where: { id: existing.id } });

    ResponseHandler.success(res, "Match submission withdrawn.", { id: matchId });
  },
);