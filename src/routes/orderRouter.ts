import { Router, Request, Response, NextFunction } from "express";
import { orderController } from "../controller/orderController.js";
import { verifyTokenAccess, verifyTokenOrder, verifyTokenUser, verifyTokenOrderOptional } from "../middleware/checkToken.js";
import { validateJoi } from "../middleware/validateJoi.js";
import { validateItemAndTableOrder, validateIdOrder, createOrderSchema, validateUpdateItemStatus, validateDeleteItem, validateUpdateOrderStatus } from "../validations/ordersValidation.js";
import { checkRole } from "../middleware/checkRole.js";
import { optionalVerifyTokenUser } from "../middleware/checkToken.js";
import { apiRateLimitMiddleware } from "../middleware/rateLimiter.js";
import { orderPerformanceMiddleware } from "../middleware/performanceMiddleware.js";

const router = Router();

router.post("/", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenAccess, optionalVerifyTokenUser, verifyTokenOrderOptional, validateJoi(createOrderSchema, "body"), orderController.create);

// router.post("/call", verifyTokenAccess, orderController.callWaiter);

router.put("/:orderId/items/:itemId/status", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi( validateUpdateItemStatus, "params" ), orderController.updateStatusItems);

router.delete("/:orderId/items/:itemId", apiRateLimitMiddleware, verifyTokenUser, checkRole(["waiter", "admin"]), validateJoi( validateUpdateItemStatus, "params" ), validateJoi( validateDeleteItem, "body" ), orderController.deleteItem);

router.get("/user", verifyTokenUser, orderController.getByUserId);

router.get("/validate", verifyTokenOrder, orderController.validate);

router.get("/user-token", verifyTokenOrder, orderController.getByTokenUser)

router.get("/restaurant-paginate", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getByRestaurantId);

router.get("/restaurant", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getOrdersByRestaurant);

router.put("/:id", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi(validateIdOrder,"params"), validateJoi(validateUpdateOrderStatus, "body"), orderController.updateStatusOrder);

router.get("/:id/details", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getOrderDetails);

export default router;