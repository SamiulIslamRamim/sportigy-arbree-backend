import { z } from "zod";

export const playerRegisterSchema = z.object({
  username: z.string(),
  name: z.string(),
  email: z.email(),
  birthday: z.string().optional(),
  contact_no: z.string(),
  height: z.string().optional(),
  weight: z.string().optional(),
  category: z.array(z.string()).optional(),
  website_url: z.url().optional(),
  password: z.string().min(6),
});

