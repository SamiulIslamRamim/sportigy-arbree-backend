import { z } from "zod";
import { playerRegisterSchema } from "../schemas/player.schema";

export type PlayerRegisterBody = z.infer<typeof playerRegisterSchema>;
