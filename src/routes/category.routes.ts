import { Router, Request, Response, NextFunction } from "express";
import { categoryController } from "../controller/category.controller.js";
import { checkRole } from "../middleware/role.middleware.js";
import { createCategorySchema, updateCategorySchema, updateCategoryParamsSchema, deleteCategorySchema } from "../validation/category.validation.js";
import { validateRequest } from "../middleware/validator.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Obtener categorias (admin)
router.get(
    "/", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    categoryController.getByAdmin
);

// Crear categoria
router.post(
    "/", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    validateRequest(createCategorySchema, "body"), 
    categoryController.create
);

// Actualizar categoria
router.put(
    "/:id", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    validateRequest(updateCategoryParamsSchema, "params"), 
    validateRequest(updateCategorySchema, "body"), 
    categoryController.update
);

// Eliminar categoria 
router.delete(
    "/:id", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    validateRequest(deleteCategorySchema, "params"), 
    categoryController.delete
);

// Obtener categorias para menu (cualquier usuario con acceso al restaurante)
router.get(
    "/public/:restaurantId", 
    categoryController.getByClient
);

export default router;