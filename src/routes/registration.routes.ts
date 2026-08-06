import { Router } from "express";
import {
  listSports,
  orgCategory,
  registerOrganization,
  registerPlayer,
} from "../controllers/auth-register.controller.js";
import { verifyRegistrationOtp } from "../controllers/auth-verify.controller.js";

const router = Router();

// ─── Registration ──────────────────────────────────────────────────────────────
router.get("/sports", listSports);
router.get("/org-categories", orgCategory);
router.post("/players/", registerPlayer);
router.post("/organizations/", registerOrganization);
router.post("/verify-registration/", verifyRegistrationOtp);

export default router;