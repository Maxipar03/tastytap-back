import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { foodController } from "../controller/food.controller.js";
import { validateCreateFood, validateUpdateFood, validateParamsFoodId, validateMenuFilters } from "../validation/food.validation.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { verifyTokenAccess, verifyTokenUser } from "../middleware/check-token.js";
import { checkRole } from "../middleware/check-role.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Creacion de comidas 
router.post("/", verifyTokenUser, validateJoi(validateCreateFood, "body"), checkRole(["admin", "owner"]), upload.single('image'), foodController.create);

// Obtencion de comidas (usuario)
router.get("/", verifyTokenAccess, validateJoi(validateMenuFilters, "query"),  foodController.getAllMenu);

// Obtencion de comidas (admin)
router.get("/admin", verifyTokenUser, checkRole(["waiter", "admin", "owner"]), foodController.getAllAdmin);

// Actualizacion de comida
router.put("/:id", verifyTokenUser, checkRole(["admin", "owner"]), validateJoi(validateParamsFoodId, "params"), validateJoi(validateUpdateFood, "body"), upload.single('image'), foodController.update);

// Obtencion de comida por id
router.get("/:id", validateJoi(validateParamsFoodId, "params"), foodController.getById);

// Eliminacion de comida
router.delete("/:id", verifyTokenUser, checkRole(["admin", "owner"]), validateJoi(validateParamsFoodId, "params"), foodController.delete);

export default router