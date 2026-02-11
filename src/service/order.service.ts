import { Types } from "mongoose";
import { orderMongoDao } from "../dao/mongodb/order.dao.js";
import { foodMongoDao } from "../dao/mongodb/food.dao.js";
import { userMongoDao } from "../dao/mongodb/user.dao.js";
import { orderEvents } from "../events/order.events.js";
import { CreateOrderDto } from "../dto/order.dto.js";
import { OrderDB, ItemStatus, CreateOrderResponse, OrderFilters, PaymentMethod, OrderItem } from "../types/order.js";
import { tableServices } from "./table.service.js";
import { tableSessionService } from "./table-session.service.js";
import { CACHE_TTL, CACHE_KEYS, TAX_RATE } from "../constants/business.js";
import { CustomError, NotFoundError, OrderReadyError, BadRequestError } from "../utils/custom-error.js";
import { withTransaction } from "../utils/transaction-manager.js";
import { getKdsStatusFromItems } from "../utils/orders.js";
import logger from "../utils/logger.js";
import generateToken from "../utils/generate-token.js";
import cache from "../utils/cache.js";

export default class OrderService {
    private dao: typeof orderMongoDao;

    constructor(dao: typeof orderMongoDao) {
        this.dao = dao;
    }

    private decreaseStock = async (items: Array<OrderItem>, session?: any): Promise<void> => {
        for (const item of items) {
            if (item.foodId) {
                const food = await foodMongoDao.getById(item.foodId.toString());
                if (!food) {
                    logger.error({ foodId: item.foodId }, "Comida no encontrada al restar stock");
                    throw new NotFoundError("No se encontro la comida al restar stock");
                }

                if (food.stock < item.quantity) {
                    logger.warn({
                        foodId: item.foodId,
                        foodName: food.name,
                        requestedQuantity: item.quantity,
                        availableStock: food.stock
                    }, "Stock insuficiente para completar orden");
                    throw new OrderReadyError(`No hay suficiente stock de ${food.name} para completar la orden. Stock disponible: ${food.stock}`);
                }

                await foodMongoDao.decreaseStock(item.foodId, item.quantity, session);
            }
        }
    };

    private async handleTableSession(body: CreateOrderDto, orderId: Types.ObjectId | string, session: any): Promise<void> {
        if (!body.tableId) throw new BadRequestError("Table ID is required for dine-in orders");

        const table = await tableServices.getById(body.tableId);
        let sessionId = table?.activeSession;

        if (!sessionId) {
            const newSession = await tableSessionService.createSession(
                body.restaurant,
                body.tableId,
                session
            );
            sessionId = newSession._id;

            await tableServices.update(
                body.tableId,
                { activeSession: sessionId },
                body.restaurant
            );
        }

        if (!sessionId) throw new CustomError("No se pudo determinar la sesión de la mesa", 500);

        await tableSessionService.addOrderToSession(sessionId, orderId, session);
    }

    private invalidateOrderCache = async (orderId: string, restaurantId?: string | Types.ObjectId): Promise<void> => {
        await cache.del(CACHE_KEYS.order(orderId.toString()));
        if (restaurantId) await cache.del(CACHE_KEYS.activeOrders(restaurantId.toString()));
    };

    private async finalizeOrderCreation(orderDoc: OrderDB, body: CreateOrderDto, session: any): Promise<CreateOrderResponse> {
        const populated = await orderDoc.populate([
            { path: "waiterId", select: "name email role profileImage" },
            { path: "tableId", select: "tableNumber status waiterServing", populate: { path: "waiterServing", select: "name email role profileImage" } }
        ]);

        if (body.clientId) await userMongoDao.addOrderToUser(body.clientId, orderDoc._id.toString(), session);

        const orderObj = populated.toObject();
        const kdsStatus = getKdsStatusFromItems(orderObj.items);

        orderEvents.emitOrderCreated({ orderId: orderObj._id, order: { ...orderObj, kdsStatus }, kdsStatus, waiterId: body.waiterId, restaurant: body.restaurant, timestamp: new Date() });
        await this.invalidateOrderCache(orderObj._id.toString(), body.restaurant.toString());

        return { order: populated, token: generateToken({ orderId: orderObj._id }, "7d") };
    }

    private async handleExistingOrderUpdate(orderId: string, items: OrderItem[], session: any): Promise<{ order: OrderDB, token: string }> {
        const updatedOrder = await this.addItemsToOrder(orderId, items, session);
        if (!updatedOrder) throw new CustomError("Error al agregar items a la orden", 500);

        const orderToken = generateToken({ orderId: updatedOrder._id }, "7d");
        return { order: updatedOrder, token: orderToken };
    }

    private async handleTableSessionClosure(order: OrderDB, restaurant: string, session: any): Promise<void> {
        const tableSession = await tableSessionService.getActiveSession(order.tableId!, session);
        if (!tableSession) return;

        const allOrdersCompleted = tableSession.orders.every((o: any) =>
            o.status === "paid" || o.status === "cancelled"
        );

        if (allOrdersCompleted) {
            await tableSessionService.closeSession(tableSession._id);
            await tableServices.update(order.tableId!, {
                state: "available",
                waiterServing: null,
                activeSession: null
            }, restaurant);
        }
    }

    private async finalizeOrderUpdate(order: OrderDB, body: Partial<OrderDB>, restaurant: string): Promise<OrderDB> {
        const orderObj = order.toObject ? order.toObject() : order;
        const kdsStatus = getKdsStatusFromItems(orderObj.items);

        orderEvents.emitOrderUpdated({ orderId: orderObj._id, newStatus: body.status || orderObj.status, kdsStatus, order: { ...orderObj, kdsStatus }, restaurant, timestamp: new Date() });
        await this.invalidateOrderCache(orderObj._id.toString(), restaurant);
        return order;
    }

    private async recalculateOrderPricing(order: OrderDB): Promise<void> {
        const activeItems = order.items.filter(item => item.status !== "cancelled");
        const subtotal = activeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const tax = subtotal * TAX_RATE;
        const total = subtotal + tax;

        await this.dao.update(order._id.toString(), { "pricing.subtotal": subtotal, "pricing.tax": tax, "pricing.total": total } as any);
        order.pricing = { subtotal, tax, total };
    }

    private async finalizeItemUpdate(order: OrderDB, itemId: Types.ObjectId | string, newStatus: string): Promise<OrderDB> {
        const orderObj = order.toObject ? order.toObject() : order;
        const kdsStatus = getKdsStatusFromItems(orderObj.items);

        orderEvents.emitItemUpdated({ orderId: orderObj._id.toString(), itemId: itemId.toString(), newStatus, kdsStatus, tableId: orderObj.tableId, order: { ...orderObj, kdsStatus }, type: "item", restaurant: orderObj.restaurant });
        await this.invalidateOrderCache(orderObj._id.toString(), orderObj.restaurant.toString());
        return order;
    }

    create = async (body: CreateOrderDto, orderId: string): Promise<CreateOrderResponse> => {
        return withTransaction(async (session) => {

            // Actualización de orden existente
            if (orderId) return await this.handleExistingOrderUpdate(orderId, body.items, session);

            // Lógica de items "ToGo"
            if (body.orderType === "togo") {
                body.items = body.items.map(item => ({
                    ...item,
                    status: "awaiting_payment" as any
                }));
                body.status = "awaiting_payment";
            } else {
                await this.decreaseStock(body.items, session);
            }

            const newOrder = await this.dao.create(body, session);

            // Lógica de sesión en caso de que sea orden de mesa
            if (body.orderType === "dine-in" && body.tableId) await this.handleTableSession(body, newOrder._id, session);

            return await this.finalizeOrderCreation(newOrder, body, session);
        });
    };

    updateStatusOrder = async (id: string, body: Partial<OrderDB>, restaurant: string | Types.ObjectId, waiterId?: string | Types.ObjectId, externalSession?: any): Promise<OrderDB | null> => {
        const operation = async (txSession: any) => {
            // Preparacion de datos (quien cancela)
            if (body.status === "cancelled" && waiterId) body.cancelledBy = waiterId as Types.ObjectId;

            // Gestion de stock en caso "ToGo"
            if (body.status === "paid" || body.isPaid === true) {
                const currentOrder = await this.dao.getById(id);
                if (currentOrder && currentOrder.orderType === "togo" && !currentOrder.isPaid) await this.decreaseStock(currentOrder.items, txSession);
            }

            // Actualizacion en DB
            const response = await this.dao.update(id, body, txSession);
            if (!response) throw new NotFoundError("No se encontro el pedido");

            // Lógica de sesión (solo para Dine-in finalizados)
            if ((body.status === "cancelled" || body.status === "paid") && response.orderType === "dine-in" && response.tableId) {
                await this.handleTableSessionClosure(response, restaurant.toString(), txSession);
            }

            // Lógica de items "ToGo" pagados
            if (response.orderType === "togo" && body.isPaid === true) {
                const itemsToUpdate = response.items.filter(item => item.status === "awaiting_payment");
                for (const item of itemsToUpdate) {
                    await this.dao.updateStatusItems(id, item._id, "pending");
                }
            }

            return await this.finalizeOrderUpdate(response, body, restaurant.toString());
        };

        return externalSession ? operation(externalSession) : withTransaction(operation);
    };

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: ItemStatus, deletionReason?: string): Promise<OrderDB | null> => {
        try {
            const checkStatus = newStatus === "delivered" ? "ready" : undefined;

            const updatedOrder = await this.dao.updateStatusItems(orderId, itemId, newStatus, deletionReason, checkStatus);

            if (!updatedOrder) throw new NotFoundError("No se encontró la orden o el item");

            // Si todos los items están entregados/cancelados, cambiar orden a awaiting_payment
            if (newStatus === "delivered" || newStatus === "cancelled") {
                const allDelivered = updatedOrder.items.every(item =>
                    item.status === "delivered" || item.status === "cancelled"
                );

                if (allDelivered && updatedOrder.status === "open" && updatedOrder.orderType === "dine-in") {
                    await this.updateStatusOrder(orderId.toString(), { status: "awaiting_payment" }, updatedOrder.restaurant);
                    updatedOrder.status = "awaiting_payment";
                }
                if (allDelivered && updatedOrder.status === "open" && updatedOrder.orderType === "togo") {
                    await this.updateStatusOrder(orderId.toString(), { status: "paid" }, updatedOrder.restaurant);
                    updatedOrder.status = "paid";
                }

            }

            if (newStatus === "cancelled") await this.recalculateOrderPricing(updatedOrder);

            return await this.finalizeItemUpdate(updatedOrder, itemId, newStatus);

        } catch (error) {
            throw error;
        }
    };

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: OrderItem[], session?: any): Promise<OrderDB | null> => {
        const operation = async (txSession: any) => {
            const currentOrder = await this.dao.getById(orderId);
            if (!currentOrder) throw new NotFoundError("No se encontró la orden");
            if (currentOrder.status === "paid" || currentOrder.status === "cancelled") throw new OrderReadyError("Orden cerrada");

            if (currentOrder.orderType !== "togo" || currentOrder.status !== "awaiting_payment") {
                await this.decreaseStock(items, txSession);
            }

            const updatedOrder = await this.dao.addItemsToOrder(orderId, items, txSession);
            if (!updatedOrder) throw new NotFoundError("No se encontró la orden");

            const orderObj = updatedOrder.toObject();
            const kdsStatus = getKdsStatusFromItems(orderObj.items);

            const payload = {
                order: { ...orderObj, kdsStatus },
                kdsStatus,
                timestamp: new Date()
            };

            orderEvents.emitItemAdded({
                ...payload,
                orderId: orderObj._id,
                restaurant: orderObj.restaurant
            });

            await this.invalidateOrderCache(orderObj._id.toString(), orderObj.restaurant.toString());

            return updatedOrder;
        };

        return session ? operation(session) : withTransaction(operation);
    };

    selectPayMethod = async (idOrder: string | Types.ObjectId, paymentMethod: PaymentMethod): Promise<OrderDB | null> => {
        const order = await this.dao.update(idOrder, { paymentMethod } as any);
        if (!order) throw new NotFoundError("No se encontro el pedido");

        orderEvents.emitPayMethodSelected({
            orderId: order._id,
            restaurant: order.restaurant,
            paymentMethod
        });

        return order;
    };

    getById = async (id: string | Types.ObjectId, populate: boolean = true) => {
        const cacheKey = CACHE_KEYS.order(id.toString());
        const cached = await cache.get<OrderDB>(cacheKey);
        if (cached) return cached;

        const order = populate ? await this.dao.getByIdWithPopulate(id) : await this.dao.getById(id);
        if (order) await cache.set(cacheKey, order, CACHE_TTL.ORDER);
        return order;
    };

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filters: OrderFilters) => {
        if (filters.status === 'active') {
            const cacheKey = CACHE_KEYS.activeOrders(restaurant.toString());
            const cached = await cache.get<OrderDB[]>(cacheKey);
            if (cached) return cached;

            const orders = await this.dao.getByRestaurantId(restaurant, filters);
            await cache.set(cacheKey, orders, CACHE_TTL.ACTIVE_ORDERS);
            return orders;
        }
        return await this.dao.getByRestaurantId(restaurant, filters);
    };

    getByUserId = async (userId: string | Types.ObjectId) => await this.dao.getByUserId(userId);

    validateTableForOrder = async (tableId: Types.ObjectId): Promise<void> => {
        const table = await tableServices.getById(tableId);
        if (!table || table.state === "available") throw new BadRequestError("Mesa no disponible");
    };
}

export const orderService = new OrderService(orderMongoDao);