import { Router } from "express";
import { getDashboard } from "../controller/dashboardController.js";
import { verifyTokenUser } from "../middleware/checkToken.js";
import { checkRole } from "../middleware/checkRole.js";

const router = Router();

router.get("/", verifyTokenUser, checkRole(["admin", "waiter"]), getDashboard);

export default router;
