import { Router, Request, Response, NextFunction } from "express";
import { accessController } from "../controller/access.controller.js";
import { validateTokenSchema, generateQRSchema } from "../validation/access.validation.js";
import { checkRole } from "../middleware/check-role.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { verifyTokenAccess } from "../middleware/check-token.js";
import { validateJoi } from "../middleware/validate-joi.js";

const router = Router();

router.post("/table-qr", verifyTokenUser , validateJoi(generateQRSchema, "body"), checkRole(["waiter", "admin"]), accessController.generateQRtable);

router.post("/togo-qr", verifyTokenUser, checkRole(["waiter", "admin"]), accessController.generateQRtoGo );

router.get("/table/qr/:token", validateJoi(validateTokenSchema, "params"), accessController.validateTokenTable);

router.get("/togo/qr/:token", validateJoi(validateTokenSchema, "params"), accessController.validateTokenToGo);

router.get("/validate", verifyTokenAccess, accessController.validate);

export default router;