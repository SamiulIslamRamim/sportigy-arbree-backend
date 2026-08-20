import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { searchOrganisations } from "../controllers/player/player-searchOrg.controller";

const organizationRoutes = Router();

organizationRoutes.get("/", authenticate, searchOrganisations);

export default organizationRoutes;
