import { Router, Request, Response, NextFunction } from "express";
import { orderController } from "../controller/orderController.js";
import { verifyTokenAccess, verifyTokenOrder, verifyTokenUser, verifyTokenOrderOptional } from "../middleware/checkToken.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { validateItemAndTableOrder, validateIdOrder, createOrderSchema, validateUpdateItemStatus } from "../validations/ordersValidation.js";
import { checkRole } from "../middleware/checkRole.js";
import { optionalVerifyTokenUser } from "../middleware/checkToken.js";

const router = Router();

router.post("/", verifyTokenAccess, optionalVerifyTokenUser, verifyTokenOrderOptional, validateJoi(createOrderSchema, "body"), orderController.create);

// router.post("/call", verifyTokenAccess, orderController.callWaiter);

router.put("/:orderId/items/:itemId/status", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi( validateUpdateItemStatus, "params" ), orderController.updateStatusItems);

router.get("/user", verifyTokenUser, orderController.getByUserId);

router.get("/user-token", verifyTokenOrder, orderController.getByTokenUser)

router.get("/restaurant", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getByRestaurantId);

router.put("/:id", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi(validateIdOrder,"params"), orderController.updateStatusOrder);

export default router;