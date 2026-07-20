import { Request, Response } from "express";

import { verifyOtpSchema } from "../schemas/auth.schema.js";
import { JwtRefreshPayload, VerifyOtpBody } from "../types/auth.type.js";
import { prisma } from "../config/prisma.js";
import { PendingPayload } from "../types/pending_registration.type.js";
import { generateAccessToken, verifyRefreshToken } from "../utils/jwt.js";

export const verifyRegistrationOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = verifyOtpSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({  message: result.error.issues[0]?.message ?? "Invalid input." }); // ← issues not errors
      return;
    }

    const { email, otp } = result.data as VerifyOtpBody;

    const pending = await prisma.pendingRegistration.findFirst({
      where: { email },
    });

    if (!pending) {
      res.status(404).json({ message: "No pending registration found for this email." });
      return;
    }

    if (new Date() > pending.expiresAt) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
      res.status(400).json({ message: "OTP has expired. Please register again." });
      return;
    }

    if (pending.otp !== otp) {
      res.status(400).json({ message: "Invalid OTP. Please try again." });
      return;
    }

    const payload = pending.payload as unknown as PendingPayload; 

    const user = await prisma.user.create({
      data: {
        email:        payload.email,
        username:     payload.username,
        name:         payload.name,
        passwordHash: payload.passwordHash,
        role:         payload.role,
        contactNo:    payload.contactNo  ?? null,
        height:       payload.height     ?? null,
        weight:       payload.weight     ?? null,
        birthday:     payload.birthday   ? new Date(payload.birthday) : null,
        categories:   payload.categories ?? [],
        websiteUrl:   payload.websiteUrl ?? null,
        city:         payload.city       ?? null,
        state:        payload.state      ?? null,
        country:      payload.country    ?? null,
      },
    });

    
    if (payload.shouldCreateCricketProfile) {
      await prisma.cricketProfile.create({
        data: {
              userId: user.id,
              playingRole: null,
              battingStyle: null,
              bowlingStyle: null,
              academy: null,
            },
      });
    }
    // return user;

    await prisma.pendingRegistration.delete({ where: { id: pending.id } });

    res.status(201).json({
      id:      user.id,
      email:   user.email,
      role:    user.role,
      message: "Account verified and created successfully.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
};

export const verifySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ detail: "No session found." });
      return;
    }

    let decoded: JwtRefreshPayload;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ detail: "Session expired." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.clearCookie('refreshToken', { path: '/token' });
      res.status(401).json({ detail: "Session expired." });
      return;
    }

    // Return a new access token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      accessToken: newAccessToken,
      user,
    });
  } catch (error) {
    console.error("Verify session error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};