import { Router } from "express";
import { verifyTokenUser } from "../middleware/check-token.js";
import { userValidationController } from "../controller/user-validations.controller.js";

const router = Router();

// Admin envía invitación de creacion
router.post("/", verifyTokenUser, userValidationController.createUserValidation);

// Admin envía invitación de creacion
router.post("/:id", verifyTokenUser, userValidationController.validateToken);

export default router;
