import { Router, Request, Response, NextFunction } from "express";
import { categoryController } from "../controller/categoryController.js";
import { checkRole } from "../middleware/checkRole.js";
import { createCategorySchema, updateCategorySchema, updateCategoryParamsSchema, deleteCategorySchema } from "../validations/categoryValidation.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { verifyTokenUser } from "../middleware/checkToken.js";
import { verifyTokenAccess } from "../middleware/checkToken.js";

const router = Router();

router.get("/", verifyTokenUser, categoryController.categoryByRestaurant);

router.post("/", verifyTokenUser , checkRole("admin"), validateJoi(createCategorySchema, "body") ,categoryController.create);

router.put("/:id", verifyTokenUser, checkRole("admin"), validateJoi(updateCategoryParamsSchema, "params"), validateJoi(updateCategorySchema, "body"), categoryController.update);

router.delete("/:id", verifyTokenUser , checkRole("admin"), validateJoi(deleteCategorySchema, "params"), categoryController.delete);

router.get("/menu", verifyTokenAccess, categoryController.getByRestaurant);

export default router;