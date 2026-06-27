import { Router, Request, Response, NextFunction } from "express";
import { userController } from "../controller/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { passportCall } from "../middleware/passport.middleware.js";
import { validateRequest } from "../middleware/validator.middleware.js";
import { loginUserSchema, registerUserSchema } from "../validation/user.validation.js";
import { rateLimitStrict } from "../middleware/ratelimit.middleware.js";

const router = Router();

// Registro de usuario
router.post(
    "/register",
    rateLimitStrict,
    validateRequest(registerUserSchema, "body"),
    userController.register
);

// Inicio de usuario
router.post(
    "/login",
    rateLimitStrict,
    validateRequest(loginUserSchema, "body"),
    userController.login
);

// Deslogeo de usuario
router.post(
    "/logout",
    userController.logout
);

// Obtencion de usuario
router.get(
    "/me",
    authenticate,
    userController.getUser
);

router.get(
    "/auth/google",
    rateLimitStrict,
    passportCall('google', { scope: ['profile', 'email'] })
);

router.get(
    "/oauth2/redirect/accounts.google.com",
    rateLimitStrict,
    passportCall('google', { assignProperty: "user" }),
    userController.googleResponse
);

router.post(
    "/verify",
    rateLimitStrict,
    authenticate,
    userController.verify
);

router.post(
    "/resend-verification",
    authenticate,
    userController.resendVerification
)

export default router;