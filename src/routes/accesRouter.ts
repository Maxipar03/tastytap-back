import { Router, Request, Response, NextFunction } from "express";
import { accessController } from "../controller/accessController.js";
import { validateTokenSchema, generateQRSchema } from "../validations/accessValidation.js";
import { validateParams } from "../middleware/validateParams.js";
import { checkRole } from "../middleware/checkRole.js";
import { verifyTokenUser } from "../middleware/checkToken.js";
import { verifyTokenAccess } from "../middleware/checkToken.js";
import { validateJoi } from "../middleware/validateJoi.js";

const router = Router();

router.post("/generate-qr", verifyTokenUser , validateJoi(generateQRSchema, "body"), checkRole(["waiter", "admin"]), accessController.generateQRAcces);

router.get("/qr/:token", validateJoi(validateTokenSchema, "params"), accessController.validateToken);

router.get("/validate",verifyTokenAccess, accessController.validate);

export default router;