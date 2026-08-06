import { Router } from "express";
import { login, refresh } from "../controllers/auth-login.controller.js";
import { logout } from "../controllers/auth-logout.controller.js";
import { verifySession } from "../controllers/auth-verify.controller.js";
import {
  sendOtp,
  verifyOtpAndReset,
} from "../controllers/auth-password-reset.controller.js";

const router = Router();

// ─── Auth ──────────────────────────────────────────────────────────────────────
router.post("/token/", login);
router.post("/token/refresh/", refresh);
router.get("/token/verify", verifySession);
router.post("/logout", logout);

// ─── Password Recovery ─────────────────────────────────────────────────────────
router.post("/forgot-password/", sendOtp);
router.post("/reset-password/", verifyOtpAndReset);

export default router;