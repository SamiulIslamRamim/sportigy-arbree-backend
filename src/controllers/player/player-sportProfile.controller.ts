import { Response } from "express";
import { AuthenticatedRequest } from "../../types/auth.type.js";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../config/prisma.js";
import { ResponseHandler } from "../../utils/Responsehandler";
import { assertNonEmptyUpdate, parseBody, parseParams, requireUserId } from "../../utils/helper";
import { addSportProfileSchema, sportProfileParamsSchema, updateBasicProfileSchema, updateSportProfileSchema } from "../../schemas/player.schema";
import { FieldSection, FieldType } from "../../generated/prisma/enums";




export const getBasicProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
        gender: true,
        birthday: true,
        height: true,
        weight: true,
        contactNo: true,
        city: true,
        state: true,
        country: true,
        websiteUrl: true,
      },
    });
    if (!user) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    ResponseHandler.success(res, "Data found.", { profile: user });
  },
);

export const updateBasicProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const body = parseBody(updateBasicProfileSchema, req.body);
    assertNonEmptyUpdate(body);

    const profile = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.gender !== undefined && { gender: body.gender }),
        ...(body.birthday !== undefined && { birthday: body.birthday }),
        ...(body.height !== undefined && { height: body.height }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.contactNo !== undefined && { contactNo: body.contactNo }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.country !== undefined && { country: body.country }),
      },
      select: {
        id: true,
        name: true,
        bio: true,
        gender: true,
        birthday: true,
        height: true,
        weight: true,
        contactNo: true,
        city: true,
        state: true,
        country: true,
        websiteUrl: true,
      },
    });

    ResponseHandler.success(res, "Profile updated successfully.", { profile });
  },
);

export const listSportProfiles = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);

    const profiles = await prisma.playerSportProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        sport: { select: { id: true, name: true, slug: true } },
        values: {
          include: {
            field: { select: { id: true, name: true, slug: true, type: true } },
            option: { select: { id: true, label: true, value: true } },
          },
        },
      },
    });

    ResponseHandler.success(res, "Data found.", { profiles });
  },
);

export const addSportProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const body = parseBody(addSportProfileSchema, req.body);

    const sport = await prisma.sport.findUnique({ where: { id: body.sportId } });
    if (!sport || !sport.isActive) {
      throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
    }

    const existing = await prisma.playerSportProfile.findUnique({
      where: { userId_sportId: { userId, sportId: body.sportId } },
    });
    if (existing) throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);

    const profile = await prisma.playerSportProfile.create({
      data: {
        userId,
        sportId: body.sportId,
        academy: body.academy ?? null,
      },
    });

    ResponseHandler.success(res, "Sport profile added successfully.", { profile }, 201);
  },
);

export const getSportProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { sportId } = parseParams(sportProfileParamsSchema, req.params);

    const profile = await prisma.playerSportProfile.findUnique({
      where: { userId_sportId: { userId, sportId } },
      include: {
        sport: { select: { id: true, name: true, slug: true } },
        values: {
          include: {
            field: true,
            option: true,
          },
        },
      },
    });
    if (!profile) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

    ResponseHandler.success(res, "Data found.", { profile });
  },
);

export const updateSportProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = requireUserId(req);
    const { sportId } = parseParams(sportProfileParamsSchema, req.params);
    const body = parseBody(updateSportProfileSchema, req.body);
    assertNonEmptyUpdate(body);

    const profile = await prisma.$transaction(async (tx) => {
      const existing = await tx.playerSportProfile.findUnique({
        where: { userId_sportId: { userId, sportId } },
      });
      if (!existing) throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);

      const updated = await tx.playerSportProfile.update({
        where: { id: existing.id },
        data: {
          ...(body.academy !== undefined && { academy: body.academy }),
        },
      });

      if (body.values !== undefined) {
        const fieldIds = body.values.map((v) => v.fieldId);
        if (new Set(fieldIds).size !== fieldIds.length) {
          throw new AppError(ERROR_CODES.DUPLICATE_ENTRY);
        }

        const fields = await tx.sportField.findMany({
          where: { sportId, section: FieldSection.PROFILE, isActive: true },
          select: {
            id: true,
            type: true,
            options: { where: { isActive: true }, select: { id: true } },
          },
        });
        const fieldMap = new Map(fields.map((f) => [f.id, f]));

        for (const v of body.values) {
          const field = fieldMap.get(v.fieldId);
          if (!field) {
            throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
              data: { fieldId: `Unknown or inactive profile field: ${v.fieldId}` },
            });
          }
          const isSelect =
            field.type === FieldType.SELECT ||
            field.type === FieldType.MULTI_SELECT;
          if (!isSelect) {
            throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
              data: { fieldId: `Field does not accept option values: ${v.fieldId}` },
            });
          }
          const optionExists = field.options.some((o) => o.id === v.optionId);
          if (!optionExists) {
            throw new AppError(ERROR_CODES.INVALID_INPUT_FORMAT, {
              data: { fieldId: v.fieldId, optionId: `Unknown option for field: ${v.optionId}` },
            });
          }
        }

        await tx.playerFieldValue.deleteMany({ where: { profileId: existing.id } });
        if (body.values.length > 0) {
          await tx.playerFieldValue.createMany({
            data: body.values.map((v) => ({
              profileId: existing.id,
              fieldId: v.fieldId,
              optionId: v.optionId,
            })),
          });
        }
      }

      return updated;
    });

    ResponseHandler.success(res, "Sport profile updated successfully.", { profile });
  },
);