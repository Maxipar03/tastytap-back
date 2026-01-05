import { Router } from "express";
import { getDashboard } from "../controller/dashboard.controller.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { checkRole } from "../middleware/check-role.js";

const router = Router();

router.get("/", verifyTokenUser, checkRole(["admin", "waiter"]), getDashboard);

export default router;
