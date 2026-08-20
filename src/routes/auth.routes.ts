import { Router } from "express";
import { login, refresh } from "../controllers/auth-login.controller.js";
import { logout } from "../controllers/auth-logout.controller.js";
import { verifySession } from "../controllers/auth-verify.controller.js";
import {
  sendOtp,
  verifyOtpAndReset,
} from "../controllers/auth-password-reset.controller.js";

const authRoutes = Router();

// ─── Auth ──────────────────────────────────────────────────────────────────────
authRoutes.post("/token/", login);
authRoutes.post("/token/refresh/", refresh);
authRoutes.get("/token/verify", verifySession);
authRoutes.post("/logout", logout);

// ─── Password Recovery ─────────────────────────────────────────────────────────
authRoutes.post("/forgot-password/", sendOtp);
authRoutes.post("/reset-password/", verifyOtpAndReset);

export default authRoutes;
