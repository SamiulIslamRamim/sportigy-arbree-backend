import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthenticatedRequest } from "../../types/auth.type";
import { ERROR_CODES } from "../../constants/errorCodes";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../config/prisma";
import { playerInfo, updatePlayerInformationSchema } from "../../schemas/player.schema";
import { ResponseHandler } from "../../utils/Responsehandler";


export const dashboardProfileInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      weight: true,
      height: true,
      birthday: true,
      city: true,
      state: true,
      country: true,
      cricketProfile: {
        select: {
          playingRole: true,
          battingStyle: true,
          bowlingStyle: true,
          academy: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  if (!user.cricketProfile) {
    throw new AppError(ERROR_CODES.DB_RECORD_NOT_FOUND);
  }

  const dashboardData = {
    name: user.name,
    weight: user.weight,
    height: user.height,
    birthday: user.birthday,
    city: user.city,
    state: user.state,
    country: user.country,
    // playingRole: user.cricketProfile.playingRole,
    // battingStyle: user.cricketProfile.battingStyle,
    // bowlingStyle: user.cricketProfile.bowlingStyle,
    // academy: user.cricketProfile.academy,
  };

  const validData = playerInfo.parse(dashboardData);
  ResponseHandler.success(res, "Data found.", validData);
});

export const updatePlayerInformation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED);
  }

  const parsed = updatePlayerInformationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(ERROR_CODES.FIELD_VALIDATION_FAILED, { data: parsed.error.flatten() });
  }

  const {
    name, weight, height, birthday,
    city, state, country,
    playingRole, battingStyle, bowlingStyle, academy,
  } = parsed.data;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name ?? null,
      weight: weight ?? null,
      height: height ?? null,
      birthday: birthday ? new Date(birthday) : null,
      city: city ?? null,
      state: state ?? null,
      country: country ?? null,
    },
  });

  await prisma.cricketProfile.upsert({
    where: { userId },
    update: {
      playingRole: playingRole ?? null,
      battingStyle: battingStyle ?? null,
      bowlingStyle: bowlingStyle ?? null,
      academy: academy ?? null,
    },
    create: {
      userId: userId!,
      playingRole: playingRole ?? null,
      battingStyle: battingStyle ?? null,
      bowlingStyle: bowlingStyle ?? null,
      academy: academy ?? null,
    },
  });

  ResponseHandler.success(res, "Player information updated successfully.", {});
});