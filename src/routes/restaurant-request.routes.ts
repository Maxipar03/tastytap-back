import { Router } from "express";
import { checkRole } from "../middleware/check-role.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { restaurantRequestController } from "../controller/restaurant-request.controller.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { RestaurantRequestValidation, RestaurantRequestValidationUpdate } from "../validation/restaurant-request.validation.js";

const router = Router();

// Usuario envía solicitud de creacion
router.post("/", verifyTokenUser, checkRole(["admin", "owner"]),validateJoi(RestaurantRequestValidation, "body"), restaurantRequestController.createRestaurantRequest);

// Admin aprueva invitación de creacion
router.put("/approve/:id", verifyTokenUser, checkRole(["admin", "owner"]), validateJoi(RestaurantRequestValidationUpdate, "params"), restaurantRequestController.approveRequest)

export default router;
