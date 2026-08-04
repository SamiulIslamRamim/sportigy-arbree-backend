import { Request, Response } from "express";

import { JwtRefreshPayload, LoginBody } from "../../types/auth.type";
import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { generateAdminAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";

// ─── Admin Login ────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginBody;

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      res.status(401).json({ detail: "Invalid admin credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      res.status(401).json({ detail: "Invalid admin credentials" });
      return;
    }

    const accessToken = generateAdminAccessToken({ id: admin.id, role: admin.role });
    const refreshToken = generateRefreshToken({ id: admin.id });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken: accessToken,
      admin: { username: admin.username, role: admin.role },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};

// ─── Admin Refresh ──────────────────────────────────────────────
export const adminRefresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(400).json({ detail: "Refresh token is required." });
      return;
    }

    let decoded: JwtRefreshPayload;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ detail: "Refresh token invalid!" });
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) {
      res.clearCookie('refreshToken', { path: '/admin' });
      res.status(401).json({ detail: "Admin not found." });
      return;
    }

    const newAccessToken = generateAdminAccessToken({ id: admin.id, role: admin.role });
    const newRefreshToken = generateRefreshToken({ id: admin.id });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken: newAccessToken,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Admin refresh error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};

// ─── Admin Verify Session ───────────────────────────────────────
export const adminVerifySession = async (req: Request, res: Response): Promise<void> => {
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

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) {
      res.clearCookie('refreshToken', { path: '/admin' });
      res.status(401).json({ detail: "Session expired." });
      return;
    }

    const newAccessToken = generateAdminAccessToken({ id: admin.id, role: admin.role });

    res.status(200).json({
      accessToken: newAccessToken,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (error) {
    console.error("Admin verify session error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};

// ─── Admin Logout ───────────────────────────────────────────────
export const adminLogout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
    });

    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};