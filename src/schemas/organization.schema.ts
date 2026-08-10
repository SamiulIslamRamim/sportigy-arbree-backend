import { z } from "zod";

export const organizationRegisterSchema = z.object({
  username: z.string(),
  name: z.string(),
  email: z.email(),
  contactNo: z.string(),
  categories: z.array(z.string()).optional(),
  website_url: z.url().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string(),
  password: z.string().min(6),
});


export const organizationSearchQuerySchema = z.object({
  q: z.string().trim().max(100, "Search query is too long").optional(),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit max is 100").default(20),
});

