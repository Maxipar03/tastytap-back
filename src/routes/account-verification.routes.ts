import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { userValidationController } from "../controller/account-verification.controller.js";

const router = Router();

// Usuario solicita validacion de email
router.post(
    "/",
    authenticate, 
    userValidationController.createUserValidation
);

// Verifica el token de validacion de email
router.post(
    "/:id", 
    authenticate, 
    userValidationController.validateToken
);

export default router;
