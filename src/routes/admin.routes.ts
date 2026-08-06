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
  updateSport,} from "../controllers/admin/admin-sport.controller.js";
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

const router = Router();

// ─── Admin Auth ────────────────────────────────────────────────────────────────
router.post("/admin/token/", adminLogin);
router.post("/admin/token/refresh/", adminRefresh);
router.get("/admin/token/verify/", adminVerifySession);
router.post("/admin/logout/", adminLogout);

// ─── Admin Sport Hierarchy ─────────────────────────────────────────────────────
router.get("/admin/sports/", authenticateAdmin, getSports);
router.post("/admin/sports/", authenticateAdmin, createSport);
router.get("/admin/sports/:sportId/", authenticateAdmin, getSportById);
router.patch("/admin/sports/:sportId/", authenticateAdmin, updateSport);
router.delete("/admin/sports/:sportId/", authenticateAdmin, deleteSport);

router.get("/admin/sports/:sportId/categories/", authenticateAdmin, getSportCategories,);
router.post("/admin/sports/:sportId/categories/", authenticateAdmin, createSportCategory,);
router.get("/admin/sports/:sportId/categories/:categoryId/", authenticateAdmin, getSportCategoryById,);
router.patch("/admin/sports/:sportId/categories/:categoryId/", authenticateAdmin, updateSportCategory,);
router.delete("/admin/sports/:sportId/categories/:categoryId/", authenticateAdmin, deleteSportCategory,);

router.get("/admin/sports/:sportId/fields/", authenticateAdmin, getSportFields);
router.post("/admin/sports/:sportId/fields/", authenticateAdmin, createSportField,);
router.get("/admin/sports/:sportId/fields/:fieldId/", authenticateAdmin, getSportFieldById,);
router.patch("/admin/sports/:sportId/fields/:fieldId/",authenticateAdmin, updateSportField,);
router.delete("/admin/sports/:sportId/fields/:fieldId/", authenticateAdmin, deleteSportField,);

router.get("/admin/fields/:fieldId/options/", authenticateAdmin, getFieldOptions,);
router.post("/admin/fields/:fieldId/options/", authenticateAdmin, createFieldOption,);
router.patch("/admin/fields/:fieldId/options/:optionId/", authenticateAdmin, updateFieldOption,);
router.delete("/admin/fields/:fieldId/options/:optionId/", authenticateAdmin, deleteFieldOption,);

export default router;
