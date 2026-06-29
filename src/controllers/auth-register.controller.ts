import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { PlayerRegisterBody } from "../types/player.type.js";
import { OrganizationRegisterBody } from "../types/organization.type.js";
import { generateOtp, getOtpExpiry } from "../utils/otp.js";
import { PendingPayload } from "../types/pending_registration.type.js";
import { sendOtpEmail } from "../utils/mailer.js";

export const registerPlayer = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username, name, email, birthday,
      contact_no, height, weight,
      category, website_url, password,
    } = req.body as PlayerRegisterBody;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      res.status(400).json({ message: "A user with this email or username already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const otp = generateOtp();
    const expiresAt = getOtpExpiry();

    // Remove any previous pending registration for this email
    await prisma.pendingRegistration.deleteMany({ where: { email } });

    await prisma.pendingRegistration.create({
      data: {
        email,
        username,
        otp,
        expiresAt,
        payload: {
          email,
          username,
          name,
          passwordHash,
          role:       "player",
          contactNo:  contact_no,
          height:     height      ?? null,
          weight:     weight      ?? null,
          birthday:   birthday    ? new Date(birthday).toISOString() : null,
          categories: category    ?? [],
          websiteUrl: website_url ?? null,
          city:       null,
          state:      null,
          country:    null,
        } satisfies PendingPayload,
      },
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: "OTP sent to your email. Please verify within 3 minutes.",
      email,
    });
  } catch (error) {
    console.error("Register player error:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};


export const registerOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username, name, email, contact_no,
      org_category, website_url,
      city, state, country, password,
    } = req.body as OrganizationRegisterBody;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      res.status(400).json({ message: "A user with this email or username already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const otp = generateOtp();
    const expiresAt = getOtpExpiry();

    await prisma.pendingRegistration.deleteMany({ where: { email } });

    await prisma.pendingRegistration.create({
      data: {
        email,
        username,
        otp,
        expiresAt,
        payload: {
          email,
          username,
          name,
          passwordHash,
          role:       "organization",
          contactNo:  contact_no,
          websiteUrl: website_url ?? null,
          city:       city        ?? null,
          state:      state       ?? null,
          country:    country     ?? null,
          categories: org_category ?? [],
          height:     null,
          weight:     null,
          birthday:   null,
        } satisfies PendingPayload,
      },
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: "OTP sent to your email. Please verify within 3 minutes.",
      email,
    });
  } catch (error) {
    console.error("Register organization error:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

