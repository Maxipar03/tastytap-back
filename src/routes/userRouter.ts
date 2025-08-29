import { Router, Request, Response, NextFunction } from "express";
import { userController } from "../controller/userController.js";
import { verifyTokenUser } from "../middleware/checkToken.js";
import { passportCall } from "../middleware/passportCall.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { loginUserSchema, registerUserSchema } from "../validations/userValidation.js";

const router = Router();

router.post("/register", validateJoi(registerUserSchema, "body"), userController.register);

router.post("/login", validateJoi(loginUserSchema, "body"), userController.login);

router.post("/logout", userController.logout);

router.get("/me", verifyTokenUser, userController.getUser);

router.get(
    "/oauth2/redirect/accounts.google.com",
    passportCall('google', { assignProperty: "user" }),
    userController.googleResponse
);

export default router;