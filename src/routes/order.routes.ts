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

// Creacion de orden
router.post("/", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenAccess, optionalVerifyTokenUser, verifyTokenOrderOptional, validateJoi(createOrderSchema, "body"), orderController.create);

// Creacion de orden manual (admin)
router.post("/manual", verifyTokenUser, checkRole(["waiter", "admin"]), orderController.createManualOrder);

// Actualizacion de estado de items
router.put("/:orderId/items/:itemId/status", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi( validateUpdateItemStatus, "params" ), orderController.updateStatusItems);

// Envio de recibico pedido
router.post("/send-receipt", apiRateLimitMiddleware, verifyTokenOrder, optionalVerifyTokenUser, orderController.sendReceipt);

// Selecion de metodo de pago
router.put("/payment", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenOrder, orderController.selectPayMethod);

// Obtencion de orden por token
router.get("/user-token", verifyTokenOrder, orderController.getByTokenUser);

// Validacion de orden activa
router.get("/validate", verifyTokenOrder, orderController.validate);

// Obtencion de ordenes por restaurante (admin)
router.get("/restaurant-paginate", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getByRestaurantId);

// Obtencion de ordenes por restaurante (admin)
router.get("/restaurant", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getOrdersByRestaurant);

// Actualizacion de estado de orden
router.put("/:id", orderPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenUser, checkRole(["waiter", "admin", "chef"]), validateJoi(validateIdOrder,"params"), validateJoi(validateUpdateOrderStatus, "body"), orderController.updateStatusOrder);

// Obtencion de detalle de orden
router.get("/:id/details", verifyTokenUser, checkRole(["waiter", "admin", "chef"]), orderController.getOrderDetails);

// Obtencion de pedidos por usuario
// router.get("/user", verifyTokenUser, orderController.getByUserId);

export default router;