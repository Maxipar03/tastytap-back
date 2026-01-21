import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { restaurantController } from "../controller/restaurant.controller.js";
import { checkRole } from "../middleware/check-role.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { validateCreateRestaurant, validateObjectId, validateUpdateRestaurant } from "../validation/restaurant.validation.js";
import { validateJoi } from "../middleware/validate-joi.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Obtener resataurante
router.get("/", verifyTokenUser, checkRole("admin"), restaurantController.getById);

// Obtener usuarios de resaurante
router.get("/users", verifyTokenUser, checkRole("admin"), restaurantController.getRestaurantUsers);

// Obtener invitaciones de resaurante
router.get("/invitations", verifyTokenUser, checkRole("admin"), restaurantController.getRestaurantInvitations);

// Creacion de setup stripe
router.get("/create-onboarding", verifyTokenUser, checkRole("admin"), restaurantController.createOnboarding)

// Actualizacion de restaurante
router.put("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateUpdateRestaurant, "body"), validateJoi(validateObjectId, "params"), upload.single('logo'), restaurantController.update);

export default router