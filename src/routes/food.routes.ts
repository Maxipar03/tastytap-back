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

router.post("/", verifyTokenUser, validateJoi(validateCreateFood, "body"), checkRole("admin"), upload.single('image'), foodController.create);

router.get("/", verifyTokenAccess, validateJoi(validateMenuFilters, "query"),  foodController.getAllMenu);

router.get("/admin", verifyTokenUser, checkRole(["waiter", "admin"]), foodController.getAllAdmin);

router.get("/:id",validateJoi(validateParamsFoodId, "params"), foodController.getById);

router.put("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateParamsFoodId, "params"), validateJoi(validateUpdateFood, "body"), upload.single('image'), foodController.update);

router.delete("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateParamsFoodId, "params"), foodController.delete);

export default router