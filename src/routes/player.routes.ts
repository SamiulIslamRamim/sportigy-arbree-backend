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
import { createMatch, deleteMatch, getMatch, listApprovedMatches, listMatches, listPendingMatches, listRejectedMatches, updateMatch } from "../controllers/player/player-match.controller.js";
import { getCareerByTeam, getCareerStats, hideTeam, unhideTeam } from "../controllers/player/player-careerStat.controller.js";

const router = Router();

// ─── Player Profile ────────────────────────────────────────────────────────────
router.get("/player/profile", authenticate, getBasicProfile);
router.patch("/player/profile", authenticate, updateBasicProfile);
router.get("/player/sport-profiles", authenticate, listSportProfiles);
router.post("/player/sport-profiles", authenticate, addSportProfile);
router.get("/player/sport-profiles/:sportId", authenticate, getSportProfile);
router.patch("/player/sport-profiles/:sportId", authenticate, updateSportProfile);

// ─── Player Match Self-Report ────────────────────────────────────────────────
router.post("/player/matches/", authenticate, createMatch);
router.get("/player/matches/", authenticate, listMatches);
router.get("/player/matches/approved/", authenticate, listApprovedMatches);
router.get("/player/matches/pending/", authenticate, listPendingMatches);
router.get("/player/matches/rejected/", authenticate, listRejectedMatches);
router.get("/player/matches/:matchId/", authenticate, getMatch);
router.patch("/player/matches/:matchId/", authenticate, updateMatch);
router.delete("/player/matches/:matchId/", authenticate, deleteMatch);

// ─── Player Career Stats + Team Visibility (Phase 5) ─────────────────────────
router.get("/player/matches/stats/career/", authenticate, getCareerStats);
router.get("/player/matches/stats/by-team/", authenticate, getCareerByTeam);
router.post("/player/matches/team-visibility/", authenticate, hideTeam);
router.delete("/player/matches/team-visibility/", authenticate, unhideTeam);

export default router;