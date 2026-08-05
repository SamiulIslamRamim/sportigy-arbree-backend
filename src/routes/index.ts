import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import {
  sendOtp,
  verifyOtpAndReset,
} from "../controllers/auth-password-reset.controller.js";
import {
  verifyRegistrationOtp,
  verifySession,
} from "../controllers/auth-verify.controller.js";
import {
  orgCategory,
  playerCategory,
  registerOrganization,
  registerPlayer,
} from "../controllers/auth-register.controller.js";
import { login, refresh } from "../controllers/auth-login.controller.js";
import { authenticate, authenticateAdmin } from "../middleware/auth.js";
import {
  dashboardProfileInfo,
  updatePlayerInformation,
} from "../controllers/player/player-information.controller.js";
import { logout } from "../controllers/auth-logout.controller.js";
import {
  adminLogin,
  adminLogout,
  adminRefresh,
  adminVerifySession,
} from "../controllers/admin/admin-auth.controller.js";
import {
  createFieldOption,
  deleteFieldOption,
  getFieldOptions,
  updateFieldOption,
} from "../controllers/admin/admin-sportFieldOption.controller.js";
import {
  createSport,
  deleteSport,
  getSportById,
  getSports,
  updateSport,
} from "../controllers/admin/admin-sport.controller.js";
import {
  createSportCategory,
  deleteSportCategory,
  getSportCategories,
  getSportCategoryById,
  updateSportCategory,
} from "../controllers/admin/admin-sportCategory.controller.js";
import {
  createSportField,
  deleteSportField,
  getSportFieldById,
  getSportFields,
  updateSportField,
} from "../controllers/admin/admin-sportField.controller.js";

const router = Router();

// ─── Auth ──────────────────────────────────────────────────────────────────────
router.post("/token/", login);
router.post("/token/refresh/", refresh);
router.get("/token/verify", verifySession);
router.post("/logout", logout);

// ─── Registration ──────────────────────────────────────────────────────────────
router.get("/categories", playerCategory);
router.get("/org-categories", orgCategory);
router.post("/players/", registerPlayer);
router.post("/employee/", registerOrganization);
router.post("/verify-registration/", verifyRegistrationOtp);

// ─── Password Recovery ─────────────────────────────────────────────────────────
router.post("/forgot-password/", sendOtp);
router.post("/reset-password/", verifyOtpAndReset);

// ─── Player Recovery ─────────────────────────────────────────────────────────
router.get("/player-information", authenticate, dashboardProfileInfo);
router.patch("/player-information", authenticate, updatePlayerInformation);

// ─── Admin ─────────────────────────────────────────────────────────
router.post("/admin/token/", adminLogin);
router.post("/admin/token/refresh/", adminRefresh);
router.get("/admin/token/verify/", adminVerifySession);
router.post("/admin/token/logout/", adminLogout);

// ─── Admin Sport Hierarchy ────────────────────────────────────────────────────
router.get("/admin/sports/", authenticateAdmin, getSports);
router.post("/admin/sports/", authenticateAdmin, createSport);
router.get("/admin/sports/:sportId/", authenticateAdmin, getSportById);
router.patch("/admin/sports/:sportId/", authenticateAdmin, updateSport);
router.delete("/admin/sports/:sportId/", authenticateAdmin, deleteSport);

router.get(
  "/admin/sports/:sportId/categories/",
  authenticateAdmin,
  getSportCategories,
);
router.post(
  "/admin/sports/:sportId/categories/",
  authenticateAdmin,
  createSportCategory,
);
router.get(
  "/admin/sports/:sportId/categories/:categoryId/",
  authenticateAdmin,
  getSportCategoryById,
);
router.patch(
  "/admin/sports/:sportId/categories/:categoryId/",
  authenticateAdmin,
  updateSportCategory,
);
router.delete(
  "/admin/sports/:sportId/categories/:categoryId/",
  authenticateAdmin,
  deleteSportCategory,
);

router.get("/admin/sports/:sportId/fields/", authenticateAdmin, getSportFields);
router.post(
  "/admin/sports/:sportId/fields/",
  authenticateAdmin,
  createSportField,
);
router.get(
  "/admin/sports/:sportId/fields/:fieldId/",
  authenticateAdmin,
  getSportFieldById,
);
router.patch(
  "/admin/sports/:sportId/fields/:fieldId/",
  authenticateAdmin,
  updateSportField,
);
router.delete(
  "/admin/sports/:sportId/fields/:fieldId/",
  authenticateAdmin,
  deleteSportField,
);

router.get(
  "/admin/fields/:fieldId/options/",
  authenticateAdmin,
  getFieldOptions,
);
router.post(
  "/admin/fields/:fieldId/options/",
  authenticateAdmin,
  createFieldOption,
);
router.patch(
  "/admin/fields/:fieldId/options/:optionId/",
  authenticateAdmin,
  updateFieldOption,
);
router.delete(
  "/admin/fields/:fieldId/options/:optionId/",
  authenticateAdmin,
  deleteFieldOption,
);

export default router;
