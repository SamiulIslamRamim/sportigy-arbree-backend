import { z } from "zod";

export const organizationRegisterSchema = z.object({
  username: z.string(),
  name: z.string(),
  email: z.email(),
  contact_no: z.string(),
  categories: z.array(z.string()).optional(),
  website_url: z.url().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  password: z.string().min(6),
});

