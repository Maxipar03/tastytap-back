import { Router, Request, Response, NextFunction } from "express";
import { verifyTokenUser } from "../middleware/check-token.js";
import { checkRole } from "../middleware/check-role.js";
import { tableSessionController } from "../controller/table-session.controller.js";

const router = Router();

router.get("/restaurant", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), tableSessionController.getActiveSessionsByRestaurant);

router.post("/", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), tableSessionController.createSession);

export default router;