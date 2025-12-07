import { Router, Request, Response, NextFunction } from "express";
import { verifyTokenUser } from "../middleware/checkToken.js";
import { checkRole } from "../middleware/checkRole.js";
import { tableSessionController } from "../controller/tableSessionController.js";

const router = Router();

router.get("/restaurant", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), tableSessionController.getActiveSessionsByRestaurant);

router.post("/", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), tableSessionController.createSession);

export default router;