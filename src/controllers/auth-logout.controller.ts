import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ResponseHandler } from "../utils/Responsehandler.js";

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/token',
  });

  ResponseHandler.success(res, "Logged out successfully.", {});
});