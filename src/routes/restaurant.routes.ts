import { Router, Request, Response, NextFunction } from "express";
import { restaurantController } from "../controller/restaurant.controller.js";
import { checkRole } from "../middleware/check-role.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { validateCreateRestaurant, validateObjectId, validateUpdateRestaurant } from "../validation/restaurant.validation.js";
import { validateJoi } from "../middleware/validate-joi.js";

const router = Router();

router.get("/", verifyTokenUser, checkRole("admin"), restaurantController.getAll);

router.get("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateObjectId, "params"), restaurantController.getById);

router.post("/", verifyTokenUser, checkRole("admin"), validateJoi(validateCreateRestaurant, "body"), restaurantController.create);

router.put("/:id", verifyTokenUser, checkRole("admin"), validateJoi(validateUpdateRestaurant, "body"), validateJoi(validateObjectId, "params"), restaurantController.update);

export default router