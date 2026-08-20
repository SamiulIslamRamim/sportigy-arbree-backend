import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth.js";
import {
  adminLogin,
  adminLogout,
  adminRefresh,
  adminVerifySession,
} from "../controllers/admin/admin-auth.controller.js";
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
import {
  createFieldOption,
  deleteFieldOption,
  getFieldOptions,
  updateFieldOption,
} from "../controllers/admin/admin-sportFieldOption.controller.js";
import {
  approveMatch,
  getMatchSubmission,
  listMatchSubmissions,
  rejectMatch,
} from "../controllers/admin/admin-match.controller.js";
import {
  createSportMetric,
  deleteSportMetric,
  getSportMetrics,
  updateSportMetric,
} from "../controllers/admin/admin-sportMetric.controller.js";

const adminRoutes = Router();

// ─── Admin Auth ────────────────────────────────────────────────────────────────
adminRoutes.post("/token/", adminLogin);
adminRoutes.post("/token/refresh/", adminRefresh);
adminRoutes.get("/token/verify/", adminVerifySession);
adminRoutes.post("/logout/", adminLogout);

// ─── Admin Sport Hierarchy ─────────────────────────────────────────────────────
adminRoutes.get("/sports/", authenticateAdmin, getSports);
adminRoutes.post("/sports/", authenticateAdmin, createSport);
adminRoutes.get("/sports/:sportId/", authenticateAdmin, getSportById);
adminRoutes.patch("/sports/:sportId/", authenticateAdmin, updateSport);
adminRoutes.delete("/sports/:sportId/", authenticateAdmin, deleteSport);

adminRoutes.get(
  "/sports/:sportId/categories/",
  authenticateAdmin,
  getSportCategories,
);
adminRoutes.post(
  "/sports/:sportId/categories/",
  authenticateAdmin,
  createSportCategory,
);
adminRoutes.get(
  "/sports/:sportId/categories/:categoryId/",
  authenticateAdmin,
  getSportCategoryById,
);
adminRoutes.patch(
  "/sports/:sportId/categories/:categoryId/",
  authenticateAdmin,
  updateSportCategory,
);
adminRoutes.delete(
  "/sports/:sportId/categories/:categoryId/",
  authenticateAdmin,
  deleteSportCategory,
);

adminRoutes.get(
  "/sports/:sportId/fields/",
  authenticateAdmin,
  getSportFields,
);
adminRoutes.post(
  "/sports/:sportId/fields/",
  authenticateAdmin,
  createSportField,
);
adminRoutes.get(
  "/sports/:sportId/fields/:fieldId/",
  authenticateAdmin,
  getSportFieldById,
);
adminRoutes.patch(
  "/sports/:sportId/fields/:fieldId/",
  authenticateAdmin,
  updateSportField,
);
adminRoutes.delete(
  "/sports/:sportId/fields/:fieldId/",
  authenticateAdmin,
  deleteSportField,
);

adminRoutes.get(
  "/fields/:fieldId/options/",
  authenticateAdmin,
  getFieldOptions,
);
adminRoutes.post(
  "/fields/:fieldId/options/",
  authenticateAdmin,
  createFieldOption,
);
adminRoutes.patch(
  "/fields/:fieldId/options/:optionId/",
  authenticateAdmin,
  updateFieldOption,
);
adminRoutes.delete(
  "/fields/:fieldId/options/:optionId/",
  authenticateAdmin,
  deleteFieldOption,
);

// ─── Admin Sport Metrics (Phase 6) ────────────────────────────────────────────
adminRoutes.get(
  "/sports/:sportId/metrics/",
  authenticateAdmin,
  getSportMetrics,
);
adminRoutes.post(
  "/sports/:sportId/metrics/",
  authenticateAdmin,
  createSportMetric,
);
adminRoutes.patch(
  "/metrics/:metricId/",
  authenticateAdmin,
  updateSportMetric,
);
adminRoutes.delete(
  "/metrics/:metricId/",
  authenticateAdmin,
  deleteSportMetric,
);

// ─── Admin Match Review ────────────────────────────────────────────────────────
adminRoutes.get("/matches/", authenticateAdmin, listMatchSubmissions);
adminRoutes.get(
  "/matches/:matchId/",
  authenticateAdmin,
  getMatchSubmission,
);
adminRoutes.patch(
  "/matches/:matchId/approve/",
  authenticateAdmin,
  approveMatch,
);
adminRoutes.patch(
  "/matches/:matchId/reject/",
  authenticateAdmin,
  rejectMatch,
);

export default adminRoutes;
