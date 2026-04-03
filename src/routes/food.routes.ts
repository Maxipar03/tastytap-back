import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { foodController } from "../controller/food.controller.js";
import { validateCreateFood, validateUpdateFood, validateParamsFoodId, validateMenuFilters } from "../validation/food.validation.js";
import { validateRequest } from "../middleware/validator.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Creacion de comidas 
router.post(
    "/", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    validateRequest(validateCreateFood, "body"), 
    upload.single('image'), 
    foodController.create
);

// Obtencion de comidas (usuario)
router.get(
    "/menu/:restaurantId", 
    validateRequest(validateMenuFilters, "query"), 
    foodController.getAllMenu
);

// Obtencion de comidas (Panel admin)
router.get(
    "/admin", 
    authenticate, 
    checkRole(["waiter", "admin", "owner"]), 
    foodController.getAllAdmin
);

// Actualizacion de comida
router.put(
    "/:id", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    validateRequest(validateParamsFoodId, "params"), 
    validateRequest(validateUpdateFood, "body"), 
    upload.single('image'), 
    foodController.update
);

// Obtencion de comida por id
router.get(
    "/:id", 
    validateRequest(validateParamsFoodId, "params"), foodController.getById
);

// Eliminacion de comida
router.delete(
    "/:id", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    validateRequest(validateParamsFoodId, "params"), 
    foodController.delete
);

export default router