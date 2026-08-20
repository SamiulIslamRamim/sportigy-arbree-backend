import { Router } from "express";
import {
  listSports,
  orgCategory,
  registerOrganization,
  registerPlayer,
} from "../controllers/auth-register.controller.js";
import { verifyRegistrationOtp } from "../controllers/auth-verify.controller.js";

const registrationRoutes = Router();

// ─── Registration ──────────────────────────────────────────────────────────────
registrationRoutes.get("/sports", listSports);
registrationRoutes.get("/org-categories", orgCategory);
registrationRoutes.post("/players/", registerPlayer);
registrationRoutes.post("/organizations/", registerOrganization);
registrationRoutes.post("/verify-registration/", verifyRegistrationOtp);

export default registrationRoutes;
