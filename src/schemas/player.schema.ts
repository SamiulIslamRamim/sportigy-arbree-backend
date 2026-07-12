import { z } from "zod";
import { BattingStyle, BowlingStyle, CricketPlayingRole } from "../generated/prisma/enums";

export const playerRegisterSchema = z.object({
  username: z.string(),
  name: z.string(),
  email: z.email(),
  birthday: z.string().optional(),
  contact_no: z.string(),
  height: z.string().optional(),
  weight: z.string().optional(),
  categories: z.array(z.string()).optional(),
  website_url: z.url().optional(),
  password: z.string().min(6),
});


export const playerInfo = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),

  playingRole: z.nativeEnum(CricketPlayingRole, {
    error: "Playing role is required",
  }).nullable().optional(),

  battingStyle: z.nativeEnum(BattingStyle, {
    error: "Batting style is required",
  }).nullable().optional(),

  bowlingStyle: z.nativeEnum(BowlingStyle, {
    error: "Bowling style is required",
  }).nullable().optional(),

  academy: z
    .string()
    .trim()
    .max(100, "Academy name is too long")
    .optional(),

  weight: z
    .string()
    .trim()
    .min(1, "Weight is required").optional(),

  height: z
    .string()
    .trim()
    .min(1, "Height is required").optional(),

  birthday: z.coerce.date().optional(),

  city: z
    .string()
    .trim()
    .min(1, "City is required").optional(),

  state: z
    .string()
    .trim()
    .min(1, "State is required").optional(),

  country: z
    .string()
    .trim()
    .min(1, "Country is required").optional(),
});



