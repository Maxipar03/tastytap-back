import { Router, Request, Response, NextFunction } from "express";
import { orderController } from "../controller/orderController.js";
import { verifyTokenAccess, verifyTokenUser, verifyTokenSeat } from "../middleware/checkToken.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { validateItemAndTableOrder, validateIdOrder, createOrderSchema } from "../validations/ordersValidation.js";
import { checkRole } from "../middleware/checkRole.js";
import { optionalVerifyTokenUser } from "../middleware/checkToken.js";

const router = Router();

router.post("/", verifyTokenAccess, optionalVerifyTokenUser, verifyTokenSeat, validateJoi(createOrderSchema, "body"), orderController.create);

router.post("/call", verifyTokenAccess, orderController.callWaiter);

router.put("/:orderId/items/:itemId/status", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi( validateItemAndTableOrder, "params" ), orderController.updateStatus);

router.get("/user", verifyTokenAccess, verifyTokenUser, orderController.getByUserId)

router.get("/restaurant", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getByRestaurantId);

router.put("/:id", verifyTokenAccess, verifyTokenUser, validateJoi(validateIdOrder,"params"), orderController.update);

export default router;