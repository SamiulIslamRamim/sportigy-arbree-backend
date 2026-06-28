import { z } from "zod";
import { organizationRegisterSchema } from "../schemas/organization.schema.js";

export type OrganizationRegisterBody = z.infer<
  typeof organizationRegisterSchema
>;