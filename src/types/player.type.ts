import { z } from "zod";
import { playerRegisterSchema } from "../schemas/player.schema.js";

export type PlayerRegisterBody = z.infer<
  typeof playerRegisterSchema
>;