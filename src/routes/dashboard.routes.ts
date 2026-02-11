import { Router } from "express";
import { getDashboard } from "../controller/dashboard.controller.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { checkRole } from "../middleware/check-role.js";

const router = Router();

// Datos de panel de restaurante
router.get("/", verifyTokenUser, checkRole(["admin", "owner"]), getDashboard);

export default router;
