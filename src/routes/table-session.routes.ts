import { Router, Request, Response, NextFunction } from "express";
import { verifyTokenUser } from "../middleware/check-token.js";
import { checkRole } from "../middleware/check-role.js";
import { tableSessionController } from "../controller/table-session.controller.js";

const router = Router();

// Obtener sessiones de mesas activas por resataurante
router.get("/restaurant", verifyTokenUser, checkRole(["waiter", "admin", "chef", "owner"]), tableSessionController.getActiveSessionsByRestaurant);

// Creacion de session de mesa
router.post("/", verifyTokenUser, checkRole(["waiter", "admin", "chef", "owner"]), tableSessionController.createSession);

export default router;