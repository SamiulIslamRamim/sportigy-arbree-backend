import { z } from "zod";
import { Gender } from "../generated/prisma/enums";


export const playerRegisterSchema = z.object({
  username: z.string(),
  country: z.string(),
  name: z.string(),
  email: z.email(),
  birthday: z.string().optional(),
  contactNo: z.string(),
  height: z.string().optional(),
  weight: z.string().optional(),
  categories: z.array(z.string()).optional(),
  website_url: z.url().optional(),
  password: z.string().min(6),
});


export const sportProfileParamsSchema = z.object({
  sportId: z.uuid("Invalid sport id"),
});


export const updateBasicProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long").optional(),
  bio: z.string().trim().max(500, "Bio is too long").optional().nullable(),
  gender: z.nativeEnum(Gender, { error: "Invalid gender" }).optional().nullable(),
  birthday: z.coerce.date().optional().nullable(),
  height: z.string().trim().max(20, "Height is too long").optional().nullable(),
  weight: z.string().trim().max(20, "Weight is too long").optional().nullable(),
  contactNo: z.string().trim().max(20, "Contact number is too long").optional().nullable(),
  city: z.string().trim().max(100, "City is too long").optional().nullable(),
  state: z.string().trim().max(100, "State is too long").optional().nullable(),
  country: z.string().trim().max(100, "Country is too long").optional(),
});


export const addSportProfileSchema = z.object({
  sportId: z.uuid("Invalid sport id"),
  academy: z.string().trim().max(100, "Academy name is too long").optional().nullable(),
});

const sportProfileValueSchema = z.object({
  fieldId: z.uuid("Invalid field id"),
  optionId: z.uuid("Invalid option id"),
});

export const updateSportProfileSchema = z.object({
  academy: z.string().trim().max(100, "Academy name is too long").optional().nullable(),
  values: z.array(sportProfileValueSchema).max(200, "Too many field values").optional(),
});

