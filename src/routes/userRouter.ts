import { Router, Request, Response, NextFunction } from "express";
import { userController } from "../controller/userController.js";
import { verifyTokenUser } from "../middleware/checkToken.js";
import { passportCall } from "../middleware/passportCall.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { loginUserSchema, registerUserSchema } from "../validations/userValidation.js";
import { authRateLimitMiddleware } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authRateLimitMiddleware, validateJoi(registerUserSchema, "body"), userController.register);

router.post("/login", authRateLimitMiddleware, validateJoi(loginUserSchema, "body"), userController.login);

router.post("/logout", userController.logout);

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