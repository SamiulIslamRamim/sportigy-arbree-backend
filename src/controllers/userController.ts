import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { PlayerRegisterBody } from "../types/player.type.js";
import { OrganizationRegisterBody } from "../types/organization.type.js";

export const registerPlayer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      username,
      name,
      email,
      birthday,
      contact_no,
      height,
      weight,
      category,
      website_url,
      password,
    } = req.body as PlayerRegisterBody;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res
        .status(400)
        .json({ message: "A user with this email already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        passwordHash,
        role: "player",
        contactNo: contact_no,
        height: height ?? null, // undefined → null
        weight: weight ?? null,
        birthday: birthday ? new Date(birthday) : null,
        categories: category ?? [],
        websiteUrl: website_url ?? null,
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Register player error:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

export const registerOrganization = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      username,
      name,
      email,
      contact_no,
      org_category,
      website_url,
      city,
      state,
      country,
      password,
    } = req.body as OrganizationRegisterBody;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res
        .status(400)
        .json({ message: "A user with this email already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        passwordHash,
        role: "organization",
        contactNo: contact_no,
        websiteUrl: website_url ?? null,
        city: city ?? null,
        state: state ?? null,
        country: country ?? null,
        categories: org_category ?? [],
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      message: "Organization account created successfully",
    });
  } catch (error) {
    console.error("Register organization error:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};
