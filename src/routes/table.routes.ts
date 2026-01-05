import { Router, Request, Response, NextFunction } from "express";
import { tableController } from "../controller/table.controller.js";
import { validateUpdateTable,validateTableObjectId } from "../validation/table.validation.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { checkRole } from "../middleware/check-role.js";
import { verifyTokenUser } from "../middleware/check-token.js";

const router = Router();

router.get("/", verifyTokenUser, checkRole(["waiter", "admin"]), tableController.getByRestaurat);

router.put("/update/:tableId", verifyTokenUser, checkRole(["waiter", "admin"]), validateJoi(validateUpdateTable, "body"), validateJoi(validateTableObjectId, "params"), tableController.updateTable);

export default router