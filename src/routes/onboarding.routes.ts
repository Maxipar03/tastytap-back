import { Router } from "express";
import { checkRole } from "../middleware/role.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { onboardingController } from "../controller/onboarding.controller.js";
import { validateRequest } from "../middleware/validator.middleware.js";
import { RestaurantRequestValidation, RestaurantRequestValidationUpdate } from "../validation/onboarding.validation.js";

const router = Router();

// Usuario envía solicitud de creacion
router.post(
    "/", 
    authenticate, 
    checkRole(["ADMIN", "OWNER"]),
    validateRequest(RestaurantRequestValidation, "body"), 
    onboardingController.createOnboarding
);

// Admin aprueva invitación de creacion
router.put(
    "/approve/:id", 
    authenticate, 
    checkRole(["ADMIN", "OWNER"]), 
    validateRequest(RestaurantRequestValidationUpdate, "params"), 
    onboardingController.approveOnboarding
);

router.get(
    "/home",
    authenticate,
    checkRole(["ADMIN", "OWNER", "USER"]),
    onboardingController.homeData
);

export default router;
