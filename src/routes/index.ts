import { Router } from "express";
import authRoutes from "./auth.routes";
import registrationRoutes from "./registration.routes";
import playerRoutes from "./player.routes.js";
import adminRoutes from "./admin.routes.js"

const router = Router();

router.use(authRoutes);
router.use(registrationRoutes);
router.use(playerRoutes);
router.use(adminRoutes);

export default router;