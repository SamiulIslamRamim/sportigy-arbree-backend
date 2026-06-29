import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import { ForgotPasswordBody, ResetPasswordBody } from "../types/auth.type.js";
import { prisma } from "../config/prisma.js";

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordBody;

    if (!email) {
      res.status(400).json({ detail: "Email is required." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(200).json({
        message: "If an account with that email exists, an OTP has been sent.",
      });
      return;
    }

    const otp = otpGenerator.generate(6, {
      digits: true, upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false,
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.passwordReset.create({ data: { email, otp, expiresAt } });

    console.log(`[DEV] OTP for ${email}: ${otp}`);

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};


export const verifyOtpAndReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body as ResetPasswordBody;

    const resetRecord = await prisma.passwordReset.findFirst({
      where: { email, otp, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!resetRecord) {
      res.status(400).json({ detail: "Invalid or expired OTP." });
      return;
    }

    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { email }, data: { passwordHash } });

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ detail: "Internal server error" });
  }
};