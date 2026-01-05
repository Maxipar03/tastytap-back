import { Router, Request, Response, NextFunction } from "express";
import { orderController } from "../controller/order.controller.js";
import { verifyTokenAccess, verifyTokenOrder, verifyTokenUser, verifyTokenOrderOptional } from "../middleware/check-token.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { validateIdOrder, createOrderSchema, validateUpdateItemStatus, validateUpdateOrderStatus } from "../validation/order.validation.js";
import { checkRole } from "../middleware/check-role.js";
import { optionalVerifyTokenUser } from "../middleware/check-token.js";
import { apiRateLimitMiddleware } from "../middleware/rate-limiter.js";
import { orderPerformanceMiddleware } from "../middleware/performance-middleware.js";

const router = Router();

router.post("/", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenAccess, optionalVerifyTokenUser, verifyTokenOrderOptional, validateJoi(createOrderSchema, "body"), orderController.create);

router.post("/manual", verifyTokenUser, checkRole(["waiter", "admin"]), orderController.createManualOrder);

router.put("/:orderId/items/:itemId/status", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi( validateUpdateItemStatus, "params" ), orderController.updateStatusItems);

router.put("/payment", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenOrder, orderController.selectPayMethod);

router.get("/user", verifyTokenUser, orderController.getByUserId);

router.get("/user-token", verifyTokenOrder, orderController.getByTokenUser);

router.get("/validate", verifyTokenOrder, orderController.validate);

router.get("/restaurant-paginate", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getByRestaurantId);

router.get("/restaurant", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getOrdersByRestaurant);

router.put("/:id", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi(validateIdOrder,"params"), validateJoi(validateUpdateOrderStatus, "body"), orderController.updateStatusOrder);

router.get("/:id/details", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getOrderDetails);

export default router;