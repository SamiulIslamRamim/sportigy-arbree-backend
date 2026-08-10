import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { searchOrganisations } from "../controllers/player/player-searchOrg.controller";


const router = Router();

router.get("/organizations/", authenticate, searchOrganisations);

export default router;
