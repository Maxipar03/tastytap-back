import { Router, Request, Response, NextFunction } from "express";
import { verifyTokenAccess, optionalVerifyTokenUser, verifyTokenUser} from "../middleware/checkToken.js";
import { checkRole } from "../middleware/checkRole.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { validateDeleteSeat, validateCreateSeat, validateGetByTableIdAdmin } from "../validations/seatValidation.js";
import { seatController } from "../controller/seatController.js";

const router = Router();

router.get("/token", seatController.getSeatByToken);

router.get("/", verifyTokenAccess, seatController.getByTableId);

router.get("/admin/:tableId", verifyTokenUser, checkRole(["waiter", "admin"]),validateJoi(validateGetByTableIdAdmin, "params"), seatController.getByTableIdAdmin);

router.delete("/admin/:seatId", verifyTokenUser, checkRole(["waiter", "admin"]),validateJoi(validateDeleteSeat, "params"), seatController.deleteAdmin);

router.delete("/:seatId", verifyTokenAccess, validateJoi(validateDeleteSeat, "params"), seatController.delete);

router.post("/", verifyTokenAccess, optionalVerifyTokenUser, validateJoi(validateCreateSeat, "body"), seatController.create);

export default router;