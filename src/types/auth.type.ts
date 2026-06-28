import { Request } from "express";
import { z } from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export interface JwtRefreshPayload {
  id: string;
}


export type LoginBody = z.infer<typeof loginSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
