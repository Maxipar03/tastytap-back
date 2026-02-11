import { Router, Request, Response, NextFunction } from "express";
import { categoryController } from "../controller/category.controller.js";
import { checkRole } from "../middleware/check-role.js";
import { createCategorySchema, updateCategorySchema, updateCategoryParamsSchema, deleteCategorySchema } from "../validation/category.validation.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { verifyTokenAccess } from "../middleware/check-token.js";

const router = Router();

// Obtener categorias (admin)
router.get("/", verifyTokenUser, checkRole(["admin", "owner"]), categoryController.categoryByRestaurant);

// Crear categoria
router.post("/", verifyTokenUser , checkRole(["admin", "owner"]), validateJoi(createCategorySchema, "body") ,categoryController.create);

// Actualizar categoria
router.put("/:id", verifyTokenUser, checkRole(["admin", "owner"]), validateJoi(updateCategoryParamsSchema, "params"), validateJoi(updateCategorySchema, "body"), categoryController.update);

// Eliminar categoria 
router.delete("/:id", verifyTokenUser , checkRole(["admin", "owner"]), validateJoi(deleteCategorySchema, "params"), categoryController.delete);

// Eliminar categoria (usuario)
router.get("/menu", verifyTokenAccess, categoryController.getByRestaurant);

export default router;