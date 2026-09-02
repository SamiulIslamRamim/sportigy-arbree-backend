import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  addSportProfile,
  getBasicProfile,
  getSportProfile,
  listSportProfiles,
  updateBasicProfile,
  updateSportProfile,
} from "../controllers/player/player-sportProfile.controller.js";
import {
  createMatch,
  deleteMatch,
  getMatch,
  listApprovedMatches,
  listMatches,
  listPendingMatches,
  listRejectedMatches,
  updateMatch,
} from "../controllers/player/player-match.controller.js";
import {
  getCareerByTeam,
  getCareerStats,
  getSportCategories,
  hideTeam,
  unhideTeam,
} from "../controllers/player/player-careerStat.controller.js";
import { getPlayerSportFields } from "../controllers/player/player-sportFields.controller.js";

const playerRoutes = Router();

// ─── Player Profile ────────────────────────────────────────────────────────────
playerRoutes.get("/profile", authenticate, getBasicProfile);
playerRoutes.patch("/profile", authenticate, updateBasicProfile);
playerRoutes.get("/sport-profiles", authenticate, listSportProfiles);
playerRoutes.post("/sport-profiles", authenticate, addSportProfile);
playerRoutes.get("/sport-profiles/:sportId", authenticate, getSportProfile);
playerRoutes.patch(
  "/sport-profiles/:sportId",
  authenticate,
  updateSportProfile,
);

playerRoutes.post("/matches/team-visibility/", authenticate, hideTeam);
playerRoutes.delete("/matches/team-visibility/", authenticate, unhideTeam);

// ─── Player Match Self-Report ────────────────────────────────────────────────
playerRoutes.get("/sports/:sportId/fields/", authenticate, getPlayerSportFields);
playerRoutes.post("/matches/", authenticate, createMatch);
playerRoutes.get("/matches/", authenticate, listMatches);
playerRoutes.get("/matches/approved/", authenticate, listApprovedMatches);
playerRoutes.get("/matches/pending/", authenticate, listPendingMatches);
playerRoutes.get("/matches/rejected/", authenticate, listRejectedMatches);
playerRoutes.get("/matches/:matchId/", authenticate, getMatch);
playerRoutes.patch("/matches/:matchId/", authenticate, updateMatch);
playerRoutes.delete("/matches/:matchId/", authenticate, deleteMatch);

// ─── Player Career Stats + Team Visibility (Phase 5) ─────────────────────────
playerRoutes.get("/matches/stats/career/", authenticate, getCareerStats);
playerRoutes.get("/matches/stats/by-team/", authenticate, getCareerByTeam);
playerRoutes.get("/sports/:sportId/categories/", authenticate, getSportCategories);

export default playerRoutes;
