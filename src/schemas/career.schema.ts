import { z } from "zod";

export const sportQuerySchema = z.object({
  sportId: z.uuid("Invalid sport id"),
});

export const hiddenQuerySchema = z.enum(["include", "exclude"]);

export const byTeamStatsQuerySchema = z.object({
  sportId: z.uuid("Invalid sport id"),
  categoryId: z.uuid("Invalid category id").optional(),
});

export const teamVisibilitySchema = z
  .object({
    sportId: z.uuid("Invalid sport id"),
    teamOrgId: z.uuid("Invalid organization id").optional(),
    teamName: z
      .string()
      .trim()
      .min(1, "Team name is required")
      .max(200, "Team name is too long")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.teamOrgId === undefined) === (data.teamName === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["teamOrgId"],
        message: "Provide exactly one of teamOrgId or teamName",
      });
    }
  });