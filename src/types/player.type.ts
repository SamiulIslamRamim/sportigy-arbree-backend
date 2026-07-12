import { z } from "zod";
import { playerInfo, playerRegisterSchema } from "../schemas/player.schema.js";

export type PlayerRegisterBody = z.infer<
  typeof playerRegisterSchema
>;

export type PlayerInfo = z.infer<typeof playerInfo>;