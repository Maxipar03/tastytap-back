import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { userValidationController } from "../controller/account-verification.controller.js";

const router = Router();

// Admin envía invitación de creacion
router.post(
    "/",
    authenticate, 
    userValidationController.createUserValidation
);

// Admin envía invitación de creacion
router.post(
    "/:id", 
    authenticate, 
    userValidationController.validateToken
);

export default router;
