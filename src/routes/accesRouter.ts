import { Router, Request, Response, NextFunction } from "express";
import { accessController } from "../controller/accessController.js";
import { validateTokenSchema, generateQRSchema } from "../validations/accessValidation.js";
import { checkRole } from "../middleware/checkRole.js";
import { verifyTokenUser } from "../middleware/checkToken.js";
import { verifyTokenAccess } from "../middleware/checkToken.js";
import { validateJoi } from "../middleware/validateJoi.js";

const router = Router();

router.post("/table-qr", verifyTokenUser , validateJoi(generateQRSchema, "body"), checkRole(["waiter", "admin"]), accessController.generateQRtable);

router.post("/togo-qr", verifyTokenUser, checkRole(["waiter", "admin"]), accessController.generateQRtoGo )

router.get("/table/qr/:token", validateJoi(validateTokenSchema, "params"), accessController.validateTokenTable);

router.get("/togo/qr/:token", validateJoi(validateTokenSchema, "params"), accessController.validateTokenToGo);

router.get("/validate", verifyTokenAccess, accessController.validate);

export default router;