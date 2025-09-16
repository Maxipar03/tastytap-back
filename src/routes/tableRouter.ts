import { Router, Request, Response, NextFunction } from "express";
import { tableController } from "../controller/TableController.js";
import { validateUpdateTable,validateTableObjectId } from "../validations/tablesValidation.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { checkRole } from "../middleware/checkRole.js";
import { verifyTokenUser } from "../middleware/checkToken.js";

const router = Router();

router.get("/", verifyTokenUser, checkRole(["waiter", "admin"]), tableController.getByRestaurat);

router.get("/orders", verifyTokenUser, checkRole(["waiter", "admin"]), tableController.getTablesWithOrders);

router.put("/update/:tableId", verifyTokenUser, checkRole(["waiter", "admin"]), validateJoi(validateUpdateTable, "body"), validateJoi(validateTableObjectId, "params"), tableController.updateTable)

export default router