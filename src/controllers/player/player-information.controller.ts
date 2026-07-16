import { prisma } from "../../config/prisma";
import { playerInfo, updatePlayerInformationSchema } from "../../schemas/player.schema.js";
import { AuthenticatedRequest } from "../../types/auth.type.js";
import { Request, Response } from "express";


export const dashboardProfileInfo = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {

    const userId = req.user?.id; 

    if (!userId) {
      res.status(400).json({ detail: "User ID not found in token." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        // User table fields
        name: true,
        weight: true,
        height: true,
        birthday: true,
        city: true,
        state: true,
        country: true,
        // CricketProfile relation
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
    
    // Check if user exists
    if (!user) {
      res.status(404).json({ detail: "User Data not found in DB." });
      return;
    }

    // Check if cricket profile exists
    if (!user.cricketProfile) {
      res.status(404).json({ detail: "Cricket profile not found." });
      return;
    }

    // Format response
    const dashboardData = {
      // User table data
      name: user.name,
      weight: user.weight,
      height: user.height,
      birthday: user.birthday,
      city: user.city,
      state: user.state,
      country: user.country,
      // CricketProfile table data
      playingRole: user.cricketProfile.playingRole,
      battingStyle: user.cricketProfile.battingStyle,
      bowlingStyle: user.cricketProfile.bowlingStyle,
      academy: user.cricketProfile.academy,
    };
    const validData = playerInfo.parse(dashboardData);
    res.status(200).json(validData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ detail: "Failed to fetch dashboard data."});
  }
};


export const updatePlayerInformation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(400).json({ detail: "User ID not found in token." });
      return;
    }

    // Validate body
    const parsed = updatePlayerInformationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ detail: parsed.error.flatten() });
      return;
    }

    const {
      name, weight, height, birthday,
      city, state, country,
      playingRole, battingStyle, bowlingStyle, academy,
    } = parsed.data;

    // Update User table fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name ?? null,
        weight: weight ?? null,
        height: height ?? null,
        birthday: birthday ? new Date(birthday) : null, // convert string → Date
        city: city ?? null,
        state: state ?? null,
        country: country ?? null,
      },
    });

    // Upsert CricketProfile (in case it doesn't exist yet)
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

    res.status(200).json({ detail: "Player information updated successfully." });
  } catch (error) {
    console.error("Error updating player information:", error);
    res.status(500).json({ detail: "Failed to update player information." });
  }
};




//note: if need to fetch separately


// export const getUserProfile = async (
//   req: AuthenticatedRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id || req.user?.sub;

//     if (!userId) {
//       res.status(400).json({ detail: "User ID not found in token." });
//       return;
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         name: true,
//         weight: true,
//         height: true,
//         birthday: true,
//         city: true,
//         state: true,
//         country: true,
//       },
//     });

//     if (!user) {
//       res.status(404).json({ detail: "User not found." });
//       return;
//     }

//     res.status(200).json(user);
//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//     res.status(500).json({ detail: "Failed to fetch user profile." });
//   }
// };

// export const getCricketProfile = async (
//   req: AuthenticatedRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.user?.id || req.user?.sub;

//     if (!userId) {
//       res.status(400).json({ detail: "User ID not found in token." });
//       return;
//     }

//     const cricketProfile = await prisma.cricketProfile.findUnique({
//       where: { userId: userId },
//       select: {
//         playingRole: true,
//         battingStyle: true,
//         bowlingStyle: true,
//         academy: true,
//       },
//     });

//     if (!cricketProfile) {
//       res.status(404).json({ detail: "Cricket profile not found." });
//       return;
//     }

//     res.status(200).json(cricketProfile);
//   } catch (error) {
//     console.error("Error fetching cricket profile:", error);
//     res.status(500).json({ detail: "Failed to fetch cricket profile." });
//   }
// };