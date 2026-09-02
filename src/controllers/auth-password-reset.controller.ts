
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ForgotPasswordBody, ResetPasswordBody } from "../types/auth.type.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { prisma } from "../config/prisma.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import { ResponseHandler } from "../utils/Responsehandler.js";


export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordBody;

  if (!email) {
    throw new AppError(ERROR_CODES.REQUIRED_FIELD_MISSING);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Same response whether user exists or not (prevents email enumeration)
  if (user) {
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.passwordReset.deleteMany({
      where: { email, used: false },
    });

    await prisma.passwordReset.create({
      data: { email, otp, expiresAt },
    });

    await sendPasswordResetEmail(email, otp);
    console.log(otp);
  }

  ResponseHandler.success(res, "If an account with that email exists, an OTP has been sent.", {});
});

export const verifyOtpAndReset = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body as ResetPasswordBody;

  const resetRecord = await prisma.passwordReset.findFirst({
    where: { email, otp, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!resetRecord) {
    throw new AppError(ERROR_CODES.WRONG_CONFIRMATION_CODE);
  }

  if (new Date() > resetRecord.expiresAt) {
    throw new AppError(ERROR_CODES.CONFIRMATION_CODE_EXPIRED);
  }

  await prisma.passwordReset.update({
    where: { id: resetRecord.id },
    data: { used: true },
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({ where: { email }, data: { passwordHash } });

  ResponseHandler.success(res, "Password reset successfully.", {});
});