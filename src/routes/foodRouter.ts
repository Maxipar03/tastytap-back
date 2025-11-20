import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { foodController } from "../controller/foodController.js";
import { validateCreateFood, validateUpdateFood, validateParamsFoodId, validateMenuFilters } from "../validations/foodValidation.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { verifyTokenAccess, verifyTokenUser } from "../middleware/checkToken.js";
import { checkRole } from "../middleware/checkRole.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/", verifyTokenUser, validateJoi(validateCreateFood, "body"), checkRole("admin"), upload.single('image'), foodController.create);

router.get("/", verifyTokenAccess, validateJoi(validateMenuFilters, "query"),  foodController.getAllMenu);

router.get("/admin", verifyTokenUser, checkRole(["waiter", "admin"]), foodController.getAllAdmin)

router.get("/:id",validateJoi(validateParamsFoodId, "params"), foodController.getById);

router.put("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateParamsFoodId, "params"), validateJoi(validateUpdateFood, "body"), upload.single('image'), foodController.update);

router.delete("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateParamsFoodId, "params"), foodController.delete)

export default router