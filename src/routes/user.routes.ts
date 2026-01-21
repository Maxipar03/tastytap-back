import { Router, Request, Response, NextFunction } from "express";
import { userController } from "../controller/user.controller.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { passportCall } from "../middleware/passport-call.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { loginUserSchema, registerUserSchema } from "../validation/user.validation.js";
import { authRateLimitMiddleware } from "../middleware/rate-limiter.js";

const router = Router();

// Registro de usuario
router.post("/register", authRateLimitMiddleware, validateJoi(registerUserSchema, "body"), userController.register);

// Inicio de usuario
router.post("/login", authRateLimitMiddleware, validateJoi(loginUserSchema, "body"), userController.login);

// Deslogeo de usuario
router.post("/logout", userController.logout);

// Obtencion de usuario
router.get("/me", verifyTokenUser, userController.getUser);

router.get(
    "/auth/google",
    authRateLimitMiddleware,
    passportCall('google', { scope: ['profile', 'email'] })
);

router.get(
    "/oauth2/redirect/accounts.google.com",
    authRateLimitMiddleware,
    passportCall('google', { assignProperty: "user" }),
    userController.googleResponse
);

export default router;