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
    checkRole(["ADMIN", "OWNER"]),
    restaurantController.getById
);

// Obtener resataurante cercanos
router.get(
    "/explore",
    restaurantController.getNearbyRestaurants
);

// Obtener resataurante por ID
router.get(
    "/menu/:restaurantId",
    restaurantController.getByIdUser
);

// Obtener usuarios de resaurante
router.get(
    "/users", 
    authenticate, 
    checkRole(["ADMIN", "OWNER"]), 
    restaurantController.getRestaurantUsers
);

// Obtener invitaciones de resaurante
router.get(
    "/invitations", 
    authenticate, 
    checkRole(["ADMIN", "OWNER"]), 
    restaurantController.getRestaurantInvitations
);

// Creacion de setup stripe
router.get(
    "/create-onboarding", 
    authenticate, 
    checkRole(["ADMIN", "OWNER"]), 
    restaurantController.createOnboarding
);

// Actualizacion de restaurante
router.put(
    "/",
    authenticate, 
    checkRole(["ADMIN", "OWNER"]), 
    validateRequest(validateUpdateRestaurant, "body"),
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]), 
    restaurantController.update
);

router.post(
    "/",
    authenticate,
    validateRequest(validateCreateRestaurant, "body"),
    restaurantController.create
);


export default router