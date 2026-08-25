import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { searchOrganisations } from "../controllers/player/player-searchOrg.controller.js";

const organizationRoutes = Router();

organizationRoutes.get("/", authenticate, searchOrganisations);

export default organizationRoutes;
