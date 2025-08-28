import { Router, Request, Response, NextFunction } from "express";
import { restaurantController } from "../controller/restaurantController.js";
import { checkRole } from "../middleware/checkRole.js";
import { verifyTokenUser } from "../middleware/checkToken.js";
import { validateCreateRestaurant, validateObjectId, validateUpdateRestaurant } from "../validations/restaurantValidation.js";
import { validateJoi } from "../middleware/validateJoi.js";

const router = Router();

router.get("/", verifyTokenUser, checkRole("admin"), restaurantController.getAll);

router.get("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateObjectId, "params"), restaurantController.getById);

router.post("/", verifyTokenUser, checkRole("admin"), validateJoi(validateCreateRestaurant, "body"), restaurantController.create);

router.put("/:id", verifyTokenUser, checkRole("admin"),validateJoi(validateUpdateRestaurant, "body"), validateJoi(validateObjectId, "params"), restaurantController.update);

export default router