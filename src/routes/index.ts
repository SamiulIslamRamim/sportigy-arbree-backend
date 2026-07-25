import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendOtp, verifyOtpAndReset } from "../controllers/auth-password-reset.controller.js";
import { verifyRegistrationOtp, verifySession } from "../controllers/auth-verify.controller.js";
import { orgCategory, playerCategory, registerOrganization, registerPlayer } from "../controllers/auth-register.controller.js";
import { login, refresh } from "../controllers/auth-login.controller.js";
import { authenticate } from "../middleware/auth.js";
import { dashboardProfileInfo, updatePlayerInformation } from "../controllers/player/player-information.controller.js";
import { logout } from "../controllers/auth-logout.controller.js";
import { bulkCreatePlayers, createPlayer, getAllPlayers, getPlayerById } from "../controllers/new-player.controller.js";
import { bulkCreateMatches, createMatch, getAllMatches } from "../controllers/new-match.controller.js";
import { bulkSeedStats, getCareerSummary, getPlayerStats, recordMatchStat } from "../controllers/new-playerMatchStat.controller.js";
import { createSport, deleteSport, getAllSports, getSportById, updateSport } from "../controllers/new-sport.controller.js";
import { createCategory, deleteCategory, getCategoriesBySport, getCategoryById, updateCategory } from "../controllers/new-sportCtegory.controller.js";
import { bulkCreateStatDefinitions, createStatDefinition, deleteStatDefinition, getStatDefinitionById, getStatDefinitionsBySport, updateStatDefinition } from "../controllers/new-statDefination.controller.js";

const router = Router();

// ─── Auth ──────────────────────────────────────────────────────────────────────
// router.post("/token/",               login);
// router.post("/token/refresh/",       refresh);
// router.get("/token/verify",       verifySession);
// router.post("/logout",       logout);

// // ─── Registration ──────────────────────────────────────────────────────────────
// router.get("/categories", playerCategory);
// router.get("/org-categories", orgCategory);
// router.post("/players/",             registerPlayer);
// router.post("/employee/",            registerOrganization);
// router.post("/verify-registration/", verifyRegistrationOtp);

// // ─── Password Recovery ─────────────────────────────────────────────────────────
// router.post("/forgot-password/",     sendOtp);
// router.post("/reset-password/",      verifyOtpAndReset);


// // ─── Player Recovery ─────────────────────────────────────────────────────────
// router.get("/player-information", authenticate, dashboardProfileInfo);
// router.patch("/player-information", authenticate, updatePlayerInformation);

// ─── NEW NEW NEW ─────────────────────────────────────────────────────────
// Players
router.post('/creplayers',  createPlayer);
router.post('/players/bulk',  bulkCreatePlayers);
router.get('/geplayers',  getAllPlayers);
router.get('/players/:playerId',  getPlayerById);

// Matches
router.post('/matches',  createMatch);
router.post('/matches/bulk',  bulkCreateMatches);
router.get('/matches',  getAllMatches);

// Player Match Stats
router.post('/player-match-stats',  recordMatchStat);
router.post('/player-match-stats/bulk-seed',  bulkSeedStats);
router.get('/players/:playerId/stats',  getPlayerStats);
router.get('/players/:playerId/career-summary',  getCareerSummary);

// ============ SPORT ROUTES ============
router.post('/sports',  createSport);
router.get('/sports',  getAllSports);
router.get('/sports/:sportId',  getSportById);
router.put('/sports/:sportId',  updateSport);
router.delete('/sports/:sportId',  deleteSport);

// ============ SPORT CATEGORY ROUTES ============
router.post('/sports/:sportId/categories',  createCategory);
router.get('/sports/:sportId/categories',  getCategoriesBySport);
router.get('/sports/:sportId/categories/:categoryId',  getCategoryById);
router.put('/sports/:sportId/categories/:categoryId',  updateCategory);
router.delete('/sports/:sportId/categories/:categoryId',  deleteCategory);

// ============ STAT DEFINITION ROUTES ============
router.post('/sports/:sportId/stats',  createStatDefinition);
router.post('/sports/:sportId/stats/bulk',  bulkCreateStatDefinitions);
router.get('/sports/:sportId/stats',  getStatDefinitionsBySport);
router.get('/stats/:statId',  getStatDefinitionById);
router.put('/stats/:statId',  updateStatDefinition);
router.delete('/stats/:statId',  deleteStatDefinition);


export default router;