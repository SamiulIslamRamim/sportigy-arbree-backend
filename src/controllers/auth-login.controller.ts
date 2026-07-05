import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import { JwtRefreshPayload, LoginBody, RefreshBody } from "../types/auth.type.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";
import { hashToken } from "../utils/token.js";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginBody;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: username }, { username }] },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ detail: "No active account found with the given credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ detail: "No active account found with the given credentials" });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // store only the HASH 
    await prisma.refreshToken.create({
      data: { token: hashToken(refreshToken), userId: user.id, expiresAt: sevenDaysFromNow },
    });

    prisma.refreshToken
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch((err: Error) => console.error("Refresh token cleanup failed:", err));

    res.status(200).json({
      access: accessToken,
      refresh: refreshToken, 
      user: user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};




export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as RefreshBody;

    if (!refreshToken) {
      res.status(400).json({ detail: "Refresh token is required." });
      return;
    }

    let decoded: JwtRefreshPayload;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      res.status(401).json({ detail: "Refresh token invalid!" });
      return;
    }

    const hashedToken = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    // rotated away earlier. Someone is replaying a used/stolen token.
    if (!storedToken) {
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.id } });
      console.warn(`Refresh token reuse detected for user ${decoded.id}. All sessions revoked.`);
      res.status(401).json({ detail: "Refresh token invalid! All sessions have been logged out for security." });
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      res.status(401).json({ detail: "Refresh token invalid!" });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newAccessToken = generateAccessToken(storedToken.user);
    const newRefreshToken = generateRefreshToken(storedToken.user);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: hashToken(newRefreshToken), userId: storedToken.user.id, expiresAt: sevenDaysFromNow },
    });

    prisma.refreshToken
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch((err: Error) => console.error("Refresh token cleanup failed:", err));

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};