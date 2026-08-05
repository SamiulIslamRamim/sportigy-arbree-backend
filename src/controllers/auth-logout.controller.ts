import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ResponseHandler } from "../utils/Responsehandler";

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/token',
  });

  ResponseHandler.success(res, "Logged out successfully.", {});
});