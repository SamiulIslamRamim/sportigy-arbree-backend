import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendOtp, verifyOtpAndReset } from "../controllers/auth-password-reset.controller.js";
import { verifyRegistrationOtp } from "../controllers/auth-verify.controller.js";
import { orgCategory, playerCategory, registerOrganization, registerPlayer } from "../controllers/auth-register.controller.js";
import { login, refresh } from "../controllers/auth-login.controller.js";

const router = Router();

// ─── Auth ──────────────────────────────────────────────────────────────────────
router.post("/token/",               login);
router.post("/token/refresh/",       refresh);

// ─── Registration ──────────────────────────────────────────────────────────────
router.get("/categories", playerCategory);
router.get("/org-categories", orgCategory);
router.post("/players/",             registerPlayer);
router.post("/employee/",            registerOrganization);
router.post("/verify-registration/", verifyRegistrationOtp);

// ─── Password Recovery ─────────────────────────────────────────────────────────
router.post("/forgot-password/",     sendOtp);
router.post("/reset-password/",      verifyOtpAndReset);



export default router;