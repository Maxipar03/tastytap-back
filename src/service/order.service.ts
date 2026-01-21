import { Types } from "mongoose";
import { orderRepository } from "../repository/order.repository.js";
import { foodRepository } from "../repository/food.repository.js";
import { orderEvents } from "../events/order.events.js";
import { CreateOrderDto } from "../dto/order.dto.js";
import { UserModel } from "../dao/mongodb/models/user.model.js";
import { OrderDB, ItemStatus, CreateOrderResponse, OrderFilters, PaymentMethod } from "../types/order.js";
import { tableServices } from "./table.service.js";
import { tableSessionService } from "./table-session.service.js";
import { CACHE_TTL, CACHE_KEYS } from "../constants/business.js";
import { TAX_RATE } from "../constants/business.js";
import { CustomError, NotFoundError, OrderReadyError, BadRequestError } from "../utils/custom-error.js";
import { withTransaction } from "../utils/transaction-manager.js";
import { getKdsStatusFromItems } from "../utils/orders.js";
import logger from "../utils/logger.js";
import generateToken from "../utils/generate-token.js";
import cache from "../utils/cache.js";

export default class OrderService {
    private repository: typeof orderRepository;

    constructor(repository: typeof orderRepository) {
        this.repository = repository;
    }

    private decreaseStock = async (items: Array<any>, session?: any): Promise<void> => {
        for (const item of items) {
            if (item.foodId) {
                const food = await foodRepository.getById(item.foodId.toString());
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

                await foodRepository.decreaseStock(item.foodId, item.quantity, session);
            }
        }
    };

    private invalidateOrderCache = async (orderId: string, restaurantId?: string | Types.ObjectId): Promise<void> => {
        await cache.del(CACHE_KEYS.order(orderId.toString()));
        if (restaurantId) await cache.del(CACHE_KEYS.activeOrders(restaurantId.toString()));
    };

    create = async (body: CreateOrderDto, orderId: string): Promise<CreateOrderResponse> => {
        return withTransaction(async (session) => {

            // Si el usuario cuenta con una orden ya creada añadir items
            if (orderId) {
                const updatedOrder = await this.addItemsToOrder(orderId, body.items, session);
                if (!updatedOrder) throw new CustomError("Error al agregar items a la orden", 500);
                const orderToken = generateToken({ orderId: updatedOrder._id }, "7d");
                return { order: updatedOrder, token: orderToken };
            }

            if (body.orderType === "togo") {
                body.items = body.items.map(item => ({
                    ...item,
                    status: "awaiting_payment" as any
                }));
            } else {
                await this.decreaseStock(body.items, session);
            }

            const response = await this.repository.create(body, session);

            // Manejo de session en caso de que sea orden de mesa
            if (body.orderType === "dine-in" && body.tableId) {
                const table = await tableServices.getById(body.tableId);
                let sessionId = table?.activeSession;

                if (!sessionId) {
                    const newSession = await tableSessionService.createSession(body.restaurant, body.tableId, session);
                    sessionId = newSession._id;
                    await tableServices.update(body.tableId, { activeSession: sessionId }, body.restaurant);
                }
                await tableSessionService.addOrderToSession(sessionId, response._id, session);
            }

            // Orden con datos de mezero y mesa
            const populatedOrder = await response.populate([
                { path: "waiterId", select: "name email role profileImage" },
                {
                    path: "tableId",
                    select: "tableNumber status waiterServing",
                    populate: { path: "waiterServing", select: "name email role profileImage" }
                },
            ]);

            // Si hay usuario guardar orden
            if (body.clientId) await UserModel.findByIdAndUpdate(body.clientId, { $push: { orders: response._id } }, { session });

            const orderObj = populatedOrder.toObject();
            const kdsStatus = getKdsStatusFromItems(orderObj.items);
            const orderToken = generateToken({ orderId: orderObj._id }, "7d");

            const payload = {
                orderId: orderObj._id,
                order: { ...orderObj, kdsStatus },
                kdsStatus,
                timestamp: new Date()
            };

            orderEvents.emitOrderCreated({
                ...payload,
                waiterId: body.waiterId,
                restaurant: body.restaurant
            });

            await this.invalidateOrderCache(orderObj._id.toString(), body.restaurant.toString());

            return { order: populatedOrder, token: orderToken };
        });
    };

    updateStatusOrder = async (id: string, body: Partial<OrderDB>, restaurant: string | Types.ObjectId, waiterId?: string | Types.ObjectId, externalSession?: any): Promise<OrderDB | null> => {
        const operation = async (txSession: any) => {
            // Si se cancela la orden guardar el mozo que realizo la accion
            if (body.status === "cancelled" && waiterId) body.cancelledBy = waiterId as Types.ObjectId;

            // Si la orden es pagada y es togo descontar stock
            if (body.status === "paid" || body.isPaid === true) {
                const currentOrder = await this.repository.getById(id);
                if (currentOrder && currentOrder.orderType === "togo" && !currentOrder.isPaid) await this.decreaseStock(currentOrder.items, txSession);
            }

            const response = await this.repository.update(id, body, txSession);
            if (!response) throw new NotFoundError("No se encontro el pedido");

            const orderObj = typeof response.toObject === 'function' ? response.toObject() : response;

            if ((body.status === "cancelled" || body.status === "paid") && response.orderType === "dine-in" && response.tableId) {
                const tableSession = await tableSessionService.getActiveSession(response.tableId, txSession);
                if (tableSession) {
                    const allOrdersCompleted = tableSession.orders.every((order: any) =>
                        order.status === "paid" || order.status === "cancelled"
                    );
                    if (allOrdersCompleted) {
                        await tableSessionService.closeSession(tableSession._id);
                        await tableServices.update(response.tableId, {
                            state: "available", waiterServing: null, activeSession: null
                        }, restaurant);
                    }
                }
            }

            if (response.orderType === "togo" && body.isPaid === true) {
                const itemsToUpdate = response.items.filter(item => item.status === "awaiting_payment");
                for (const item of itemsToUpdate) {
                    await this.repository.updateStatusItems(id, item._id, "pending");
                }
            }

            // Socket.io Payload
            const kdsStatus = getKdsStatusFromItems(orderObj.items);

            const payload = {
                orderId: orderObj._id,
                newStatus: body.status || orderObj.status,
                kdsStatus,
                order: { ...orderObj, kdsStatus },
                timestamp: new Date()
            };

            orderEvents.emitOrderUpdated({
                ...payload,
                restaurant
            });

            await this.invalidateOrderCache(id, restaurant.toString());

            return response;
        };

        return externalSession ? operation(externalSession) : withTransaction(operation);
    };

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: ItemStatus, deletionReason?: string): Promise<OrderDB | null> => {
        try {
            const currentOrder = await this.repository.getById(orderId);
            if (!currentOrder) throw new NotFoundError("No se encontró la orden");

            // Verificar estado del item para marcarlo como "Entregado"
            if (newStatus === "delivered") {
                const item = currentOrder.items.find(i => i._id?.toString() === itemId.toString());
                if (!item) throw new CustomError("No se encontró el item", 404);
                if (item.status !== "ready") throw new CustomError("Solo se puede entregar un item que esté listo", 400);
            }

            const updatedOrder = await this.repository.updateStatusItems(orderId, itemId, newStatus, deletionReason);
            if (!updatedOrder) throw new CustomError("No se encontró la orden o el item", 404);

            // Si todos los items están entregados/cancelados, cambiar orden a awaiting_payment
            if (newStatus === "delivered" || newStatus === "cancelled") {
                const allDelivered = updatedOrder.items.every(item => 
                    item.status === "delivered" || item.status === "cancelled"
                );
                if (allDelivered && updatedOrder.status === "open") {
                    await this.updateStatusOrder(orderId.toString(), { status: "awaiting_payment" } ,currentOrder.restaurant,);
                    updatedOrder.status = "awaiting_payment";
                }
            }

            if (newStatus === "cancelled") {
                const activeItems = updatedOrder.items.filter(item => item.status !== "cancelled");
                const newSubtotal = activeItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                const newTax = newSubtotal * TAX_RATE;
                const newTotal = newSubtotal + newTax;

                await this.repository.update(orderId.toString(), {
                    "pricing.subtotal": newSubtotal,
                    "pricing.tax": newTax,
                    "pricing.total": newTotal
                } as any);

                updatedOrder.pricing.subtotal = newSubtotal;
                updatedOrder.pricing.tax = newTax;
                updatedOrder.pricing.total = newTotal;
            }

            // Socket.io Payload
            const orderObj = updatedOrder.toObject();
            const kdsStatus = getKdsStatusFromItems(orderObj.items);

            const payload = {
                orderId: orderId.toString(),
                itemId: itemId.toString(),
                newStatus,
                kdsStatus,
                tableId: orderObj.tableId,
                order: { ...orderObj, kdsStatus },
                type: "item",
            };

            orderEvents.emitItemUpdated({
                ...payload,
                restaurant: orderObj.restaurant
            });

            await this.invalidateOrderCache(orderId.toString(), orderObj.restaurant.toString());

            return updatedOrder;
        } catch (error) {
            throw error;
        }
    };

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: any[], session?: any): Promise<OrderDB | null> => {
        const operation = async (txSession: any) => {
            const currentOrder = await this.repository.getById(orderId);
            if (!currentOrder) throw new NotFoundError("No se encontró la orden");
            console.log(currentOrder.status)
            if (currentOrder.status === "paid" || currentOrder.status === "cancelled") throw new OrderReadyError("Orden cerrada");

            if (currentOrder.orderType !== "togo" || currentOrder.status !== "awaiting_payment") {
                await this.decreaseStock(items, txSession);
            }

            const updatedOrder = await this.repository.addItemsToOrder(orderId, items, txSession);
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
        const order = await this.repository.update(idOrder, { paymentMethod } as any);
        if (!order) throw new NotFoundError("No se encontro el pedido");

        orderEvents.emitPayMethodSelected({
            orderId: order._id,
            restaurant: order.restaurant,
            paymentMethod
        });

        return order;
    };

    // Métodos de consulta directos
    getById = async (id: string | Types.ObjectId, populate: boolean = true) => {
        const cacheKey = CACHE_KEYS.order(id.toString());
        const cached = await cache.get<OrderDB>(cacheKey);
        if (cached) return cached;

        const order = populate ? await this.repository.getByIdWithPopulate(id) : await this.repository.getById(id);
        if (order) await cache.set(cacheKey, order, CACHE_TTL.ORDER);
        return order;
    };

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filters: OrderFilters) => {
        if (filters.status === 'active') {
            const cacheKey = CACHE_KEYS.activeOrders(restaurant.toString());
            const cached = await cache.get<OrderDB[]>(cacheKey);
            if (cached) return cached;

            const orders = await this.repository.getByRestaurantId(restaurant, filters);
            await cache.set(cacheKey, orders, CACHE_TTL.ACTIVE_ORDERS);
            return orders;
        }
        return await this.repository.getByRestaurantId(restaurant, filters);
    };
    getByUserId = async (userId: string | Types.ObjectId) => await this.repository.getByUserId(userId);

    validateTableForOrder = async (tableId: string | Types.ObjectId) => {
        const table = await tableServices.getById(tableId);
        if (!table || table.state === "available") throw new BadRequestError("Mesa no disponible");
    };
}

export const orderService = new OrderService(orderRepository);