import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  email: z.email(),
  otp: z.string(),
  newPassword: z.string().min(6),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6, { message: "OTP must be 6 digits." }),
});
