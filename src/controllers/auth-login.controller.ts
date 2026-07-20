import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import {
  JwtRefreshPayload,
  LoginBody,
  RefreshBody,
} from "../types/auth.type.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";
import { hashToken } from "../utils/token.js";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginBody;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: username }, { username }] },
    });

    if (!user || !user.isActive) {
      res
        .status(401)
        .json({ detail: "No active account found with the given credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ detail: "Wrong account credentials" });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/token',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res.status(200).json({
      access: accessToken,
      user: user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const  refreshToken  = req.cookies?.refreshToken;

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

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.clearCookie('refreshToken', { path: '/token' });
      res.status(401).json({ detail: "User not found." });
      return;
    }



    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/token',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken: newAccessToken,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};
