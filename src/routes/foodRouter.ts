import { Router, Request, Response, NextFunction } from "express";
import { foodController } from "../controller/foodController.js";
import { validateCreateFood, validateUpdateFood, validateParamsFoodId, validateMenuFilters } from "../validations/foodValidation.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { verifyTokenAccess, verifyTokenUser } from "../middleware/checkToken.js";
import { checkRole } from "../middleware/checkRole.js";

const router = Router();

router.post("/", verifyTokenUser, validateJoi(validateCreateFood, "body"), checkRole("admin"), foodController.create);

router.get("/", verifyTokenAccess, validateJoi(validateMenuFilters, "query"),  foodController.getAll);

router.get("/admin", verifyTokenUser, checkRole(["waiter", "admin"]), foodController.getAllAdmin)

router.get("/:id",validateJoi(validateParamsFoodId, "params"), foodController.getById);

router.put("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateParamsFoodId, "params"), validateJoi(validateUpdateFood, "body"), foodController.update);

router.delete("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateParamsFoodId, "params"), foodController.delete)

export default router