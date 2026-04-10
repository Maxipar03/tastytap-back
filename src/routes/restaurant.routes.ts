import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { restaurantController } from "../controller/restaurant.controller.js";
import { checkRole } from "../middleware/role.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateCreateRestaurant, validateObjectId, validateUpdateRestaurant } from "../validation/restaurant.validation.js";
import { validateRequest } from "../middleware/validator.middleware.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Obtener resataurante
router.get(
    "/",
    authenticate, 
    checkRole(["admin", "owner"]),
    restaurantController.getById
);

// Obtener resataurante cercanos
router.get(
    "/explore",
    restaurantController.getNearbyRestaurants
);

// Obtener usuarios de resaurante
router.get(
    "/users", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    restaurantController.getRestaurantUsers
);

// Obtener invitaciones de resaurante
router.get(
    "/invitations", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    restaurantController.getRestaurantInvitations
);

// Creacion de setup stripe
router.get(
    "/create-onboarding", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    restaurantController.createOnboarding
);

// Actualizacion de restaurante
router.put(
    "/:id",
    authenticate, 
    checkRole(["admin", "owner"]), 
    validateRequest(validateUpdateRestaurant, "body"), 
    validateRequest(validateObjectId, "params"), 
    upload.single('logo'), 
    restaurantController.update
);

export default router