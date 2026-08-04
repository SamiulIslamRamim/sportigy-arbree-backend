import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendOtp, verifyOtpAndReset } from "../controllers/auth-password-reset.controller.js";
import { verifyRegistrationOtp, verifySession } from "../controllers/auth-verify.controller.js";
import { orgCategory, playerCategory, registerOrganization, registerPlayer } from "../controllers/auth-register.controller.js";
import { login, refresh } from "../controllers/auth-login.controller.js";
import { authenticate } from "../middleware/auth.js";
import { dashboardProfileInfo, updatePlayerInformation } from "../controllers/player/player-information.controller.js";
import { logout } from "../controllers/auth-logout.controller.js";
import { adminLogin, adminLogout, adminRefresh, adminVerifySession } from "../controllers/admin/auth.controller.js";

const router = Router();

// ─── Auth ──────────────────────────────────────────────────────────────────────
router.post("/token/",               login);
router.post("/token/refresh/",       refresh);
router.get("/token/verify",       verifySession);
router.post("/logout",       logout);

// ─── Registration ──────────────────────────────────────────────────────────────
router.get("/categories", playerCategory);
router.get("/org-categories", orgCategory);
router.post("/players/",             registerPlayer);
router.post("/employee/",            registerOrganization);
router.post("/verify-registration/", verifyRegistrationOtp);

// ─── Password Recovery ─────────────────────────────────────────────────────────
router.post("/forgot-password/",     sendOtp);
router.post("/reset-password/",      verifyOtpAndReset);


// ─── Player Recovery ─────────────────────────────────────────────────────────
router.get("/player-information", authenticate, dashboardProfileInfo);
router.patch("/player-information", authenticate, updatePlayerInformation);


// ─── Admin ─────────────────────────────────────────────────────────
router.post("/admin/token/",         adminLogin);
router.post("/admin/token/refresh/",  adminRefresh);
router.get("/admin/token/verify/",   adminVerifySession);
router.post("/admin/token/logout/",  adminLogout);

export default router;