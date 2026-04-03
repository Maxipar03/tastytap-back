import { Router, Request, Response, NextFunction } from "express";
import { orderController } from "../controller/order.controller.js";
import { authenticateOptional, authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validator.middleware.js";
import { validateIdOrder, createOrderSchema, validateUpdateItemStatus, validateUpdateOrderStatus } from "../validation/order.validation.js";
import { checkRole } from "../middleware/role.middleware.js";
import { rateLimitSensitive } from "../middleware/ratelimit.middleware.js";
import { monitorOrderSentry } from "../middleware/sentry.middleware.js";


const router = Router();

// Creacion de orden
router.post(
    "/", 
    monitorOrderSentry, 
    rateLimitSensitive, 
    authenticateOptional, 
    validateRequest(createOrderSchema, "body"), orderController.create
);

// Actualizacion de estado de items
router.put(
    "/:orderId/items/:itemId/status", 
    monitorOrderSentry, 
    rateLimitSensitive, 
    authenticate, 
    checkRole(["waiter", "admin", "chef", "owner"]), 
    validateRequest( validateUpdateItemStatus, "params" ), 
    orderController.updateStatusItems
);

// Envio de recibo pedido
router.post(
    "/send-receipt", 
    rateLimitSensitive, 
    authenticateOptional, 
    orderController.sendReceipt
);

// Obtencion de orden por Guest ID
router.get(
    "/last-orders", 
    rateLimitSensitive, 
    orderController.getOrdersGuest
);

// Checkout de orden
router.get(
    "/checkout/:id",
    authenticateOptional, 
    monitorOrderSentry, 
    orderController.checkout
);

// Obtencion de ordenes por restaurante (admin)
router.get(
    "/paginate", 
    authenticate, 
    checkRole(["waiter", "admin", "chef", "owner"]), 
    orderController.getOrdersPaginated
);

// Obtencion de ordenes por restaurante (admin)
router.get(
    "/active", 
    authenticate, 
    checkRole(["waiter", "admin", "chef", "owner"]), 
    orderController.getActiveOrders
);

// Actualizacion de estado de orden
router.put(
    "/:id/status", 
    monitorOrderSentry, 
    rateLimitSensitive,
    authenticate, 
    checkRole(["waiter", "admin", "chef", "owner"]), 
    validateRequest(validateIdOrder,"params"), 
    validateRequest(validateUpdateOrderStatus, "body"), 
    orderController.updateStatusOrder
);

// Obtencion de detalle de orden
router.get(
    "/:id/details", 
    authenticate, 
    checkRole(["waiter", "admin", "chef", "owner"]), 
    orderController.getOrderDetails
);

// Obtencion de pedidos por usuario
// router.get("/user", verifyTokenUser, orderController.getByUserId);

export default router;