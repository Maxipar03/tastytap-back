import { Types } from "mongoose";
import { orderMongoDao } from "../dao/mongodb/order.dao.js";
import { foodMongoDao } from "../dao/mongodb/food.dao.js";
import { userMongoDao } from "../dao/mongodb/user.dao.js";
import { orderEvents } from "../events/order.events.js";
import { CreateOrderDto, UpdateOrderBody, } from "../dto/order.dto.js";
import { OrderDB, ItemStatus, CreateOrderResponse, OrderFilters, OrderItem, PaymentStatus } from "../types/order.types.js";
import { CACHE_TTL, CACHE_KEYS, TAX_RATE } from "../constants/business.js";
import { CustomError, NotFoundError, BadRequestError } from "../utils/custom-error.utils.js";
import { withTransaction } from "../utils/transaction.utils.js";
import logger from "../config/logger.config.js";
import cache from "../utils/cache.utils.js";
import { stripeService } from "./stripe.service.js";

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
                    throw new BadRequestError(`No hay suficiente stock de ${food.name} para completar la orden. Stock disponible: ${food.stock}`);
                }

                await foodMongoDao.decreaseStock(item.foodId, item.quantity, session);
            }
        }
    };

    private invalidateOrderCache = async (orderId: string, restaurantId?: string | Types.ObjectId): Promise<void> => {
        await cache.del(CACHE_KEYS.order(orderId.toString()));
        if (restaurantId) await cache.del(CACHE_KEYS.activeOrders(restaurantId.toString()));
    };

    create = async (body: CreateOrderDto): Promise<CreateOrderResponse> => {
        // 1. TRANSACCIÓN DE BASE DE DATOS (Rápida y atómica)
        const newOrder = await withTransaction(async (session) => {

            const order = await this.dao.create(body, session);

            if (body.clientId) await userMongoDao.addOrderToUser(body.clientId, order._id.toString(), session);

            return order;
        });

        // 2. OPERACIONES POST-PERSISTENCIA (Servicios Externos)
        try {
            const paymentData = await stripeService.createPaymentIntent(newOrder._id.toString());

            if (!paymentData || !paymentData.paymentIntentId || !paymentData.clientSecret) throw new NotFoundError("Failed to initialize payment");

            await this.dao.update(newOrder._id, {
                paymentIntentId: paymentData.paymentIntentId,
                paymentSecret: paymentData.clientSecret
            });

            orderEvents.emitOrderCreated({
                orderId: newOrder._id,
                order: newOrder,
                restaurant: body.restaurant,
                timestamp: new Date()
            });

            await this.invalidateOrderCache(newOrder._id.toString(), body.restaurant.toString());

            return {
                order: newOrder,
                paymentIntent: paymentData
            };

        } catch (error) {
            console.error(`Error procesando pago para orden ${newOrder._id}:`, error);

            throw new Error("Order created, but payment initialization failed. Please try again from your history.");
        }
    };

    getOrdersGuest = async (guestId: string): Promise<OrderDB[]> => {
        return await this.dao.getOrdersGuest(guestId);
    };

    updateStatusOrder = async (id: string, newStatus: PaymentStatus, restaurant: string | Types.ObjectId, externalSession?: any): Promise<OrderDB | null> => {
        const operation = async (txSession: any) => {

            // Restar stock si se marca como PAID
            if (newStatus === "PAID") {
                const currentOrder = await this.dao.getById(id);
                if (!currentOrder) throw new NotFoundError("No se encontro el pedido");

                await this.decreaseStock(currentOrder.items, txSession);
            }

            // Actualizacion en DB
            const response = await this.dao.update(id, { paymentStatus: newStatus }, txSession);
            if (!response) throw new NotFoundError("No se encontro el pedido");

            const orderObj = response.toObject ? response.toObject() : response;

            orderEvents.emitOrderUpdated({ orderId: orderObj._id, newStatus: newStatus || orderObj.status, order: orderObj, restaurant, timestamp: new Date() });

            await this.invalidateOrderCache(orderObj._id.toString(), restaurant);
            return response;
        };

        return externalSession ? operation(externalSession) : withTransaction(operation);
    };

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: ItemStatus): Promise<OrderDB | null> => {
        try {
            const checkStatus = newStatus === "DELIVERED" ? "READY" : undefined;

            const updatedOrder = await this.dao.updateStatusItems(orderId, itemId, newStatus, checkStatus);
            if (!updatedOrder) throw new NotFoundError("No se encontró la orden o el item");

            const orderObj = updatedOrder.toObject ? updatedOrder.toObject() : updatedOrder;

            orderEvents.emitItemUpdated({ orderId: orderObj._id.toString(), itemId: itemId.toString(), newStatus, order: orderObj, type: "item", restaurant: orderObj.restaurant });

            await this.invalidateOrderCache(orderObj._id.toString(), orderObj.restaurant.toString());
            return updatedOrder;

        } catch (error) {
            throw error;
        }
    };

    getById = async (id: string | Types.ObjectId) => {
        const cacheKey = CACHE_KEYS.order(id.toString());
        const cached = await cache.get<OrderDB>(cacheKey);
        if (cached) return cached;

        const order = await this.dao.getById(id);
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

}

export const orderService = new OrderService(orderMongoDao);