import { Router, Request, Response, NextFunction } from "express";
import { tableController } from "../controller/table.controller.js";
import { validateUpdateTable,validateTableObjectId } from "../validation/table.validation.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { checkRole } from "../middleware/check-role.js";
import { verifyTokenUser } from "../middleware/check-token.js";

const router = Router();

// Obtener mesas por restaurante
router.get("/", verifyTokenUser, checkRole(["waiter", "admin" ,"owner"]), tableController.getByRestaurat);

// Actualizacion de mesa
router.put("/update/:tableId", verifyTokenUser, checkRole(["waiter", "admin", "owner"]), validateJoi(validateUpdateTable, "body"), validateJoi(validateTableObjectId, "params"), tableController.updateTable);

export default router