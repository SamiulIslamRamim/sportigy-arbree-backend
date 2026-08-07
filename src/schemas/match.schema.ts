import { z } from "zod";
import { ApprovalStatus, MatchResult } from "../generated/prisma/enums";

export const matchParamsSchema = z.object({
  matchId: z.uuid("Invalid match id"),
});

export const matchStatusQuerySchema = z.nativeEnum(ApprovalStatus, {
  error: "Invalid status",
});

export const matchFieldValueSchema = z.object({
  fieldId: z.uuid("Invalid field id"),
  optionId: z.uuid("Invalid option id").optional(),
  valueText: z.string().max(500, "Text value is too long").optional(),
  valueNumber: z.number().int().min(-100000).max(100000).optional(),
  valueBoolean: z.boolean().optional(),
  valueDate: z.coerce.date().optional(),
});

export type MatchFieldValueInput = z.infer<typeof matchFieldValueSchema>;

const matchHeaderFields = {
  title: z.string().trim().max(200, "Title is too long").optional().nullable(),
  tournament: z.string().trim().max(200, "Tournament name is too long").optional().nullable(),
  matchType: z.string().trim().max(100, "Match type is too long").optional().nullable(),
  venue: z.string().trim().max(200, "Venue is too long").optional().nullable(),
  homeTeam: z.string().trim().max(200, "Home team name is too long").optional().nullable(),
  awayTeam: z.string().trim().max(200, "Away team name is too long").optional().nullable(),
};

export const createMatchSchema = z.object({
  sportId: z.uuid("Invalid sport id"),
  sportCategoryId: z.uuid("Invalid category id").optional().nullable(),
  ...matchHeaderFields,
  matchDate: z.coerce.date(),
  result: z.nativeEnum(MatchResult, { error: "Invalid match result" }),
  playerTeam: z.string().trim().max(200, "Team name is too long").optional().nullable(),
  isCaptain: z.boolean().optional(),
  isSubstitute: z.boolean().optional(),
  minutesPlayed: z.number().int().min(0).max(600).optional().nullable(),
  notes: z.string().trim().max(2000, "Notes are too long").optional().nullable(),
  values: z.array(matchFieldValueSchema).max(200, "Too many field values").optional(),
});

export const updateMatchSchema = z.object({
  sportCategoryId: z.uuid("Invalid category id").optional().nullable(),
  ...matchHeaderFields,
  matchDate: z.coerce.date().optional(),
  result: z.nativeEnum(MatchResult, { error: "Invalid match result" }).optional(),
  playerTeam: z.string().trim().max(200, "Team name is too long").optional().nullable(),
  isCaptain: z.boolean().optional(),
  isSubstitute: z.boolean().optional(),
  minutesPlayed: z.number().int().min(0).max(600).optional().nullable(),
  notes: z.string().trim().max(2000, "Notes are too long").optional().nullable(),
  values: z.array(matchFieldValueSchema).max(200, "Too many field values").optional(),
});

export const rejectMatchSchema = z.object({
  reason: z.string().trim().min(1, "Reject reason is required").max(500, "Reason is too long"),
});