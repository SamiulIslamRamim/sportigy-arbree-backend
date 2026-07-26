import { Request, Response } from "express";
import { JwtRefreshPayload, LoginBody } from "../../types/auth.type";
import { generateAdminAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";


// ─── Admin Login ────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginBody;

    // ── Hardcoded admin credentials — 🔁 SWAP TO DB ─────────
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "amdin1234";

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      res.status(401).json({ detail: "Invalid admin credentials" });
      return;
    }

    const accessToken = generateAdminAccessToken({ id: "admin", role: "admin" });
    const refreshToken = generateRefreshToken({ id: "admin" });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/admin',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      access: accessToken,
      admin: { username: "admin", role: "admin" },
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

    // 🔁 SWAP TO DB: replace with prisma.admin.findUnique
    if (decoded.id !== "admin") {
      res.clearCookie('refreshToken', { path: '/admin' });
      res.status(401).json({ detail: "Admin not found." });
      return;
    }

    const newAccessToken = generateAdminAccessToken({ id: "admin", role: "admin" });
    const newRefreshToken = generateRefreshToken({ id: "admin" });

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
// Checks the refresh token cookie, validates admin, returns a new access token
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

    // 🔁 SWAP TO DB: replace with prisma.admin.findUnique
    if (decoded.id !== "admin") {
      res.clearCookie('refreshToken', { path: '/admin' });
      res.status(401).json({ detail: "Session expired." });
      return;
    }

    const newAccessToken = generateAdminAccessToken({ id: "admin", role: "admin" });

    res.status(200).json({
      accessToken: newAccessToken,
      admin: { username: "admin", role: "admin" },
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