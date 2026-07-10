import { Types } from "mongoose";
import { orderMongoDao } from "../dao/mongodb/order.dao.js";
import { foodMongoDao } from "../dao/mongodb/food.dao.js";
import { userMongoDao } from "../dao/mongodb/user.dao.js";
import { orderEvents } from "../events/order.events.js";
import { CreateOrderDto } from "../dto/order.dto.js";
import { FoodOption } from "../types/food.types.js";
import { OrderItemOption, OrderStatus } from "../types/order.types.js";
import { OrderDB, CreateOrderResponse, OrderFilters, OrderItem, PaymentStatus, OrderDao } from "../types/order.types.js";
import { CACHE_TTL, CACHE_KEYS } from "../constants/business.js";
import { NotFoundError, BadRequestError, UnauthorizedError } from "../utils/custom-error.utils.js";
import { withTransaction } from "../utils/transaction.utils.js";
import logger from "../config/logger.config.js";
import cache from "../utils/cache.utils.js";
import { stripeService } from "./stripe.service.js";

export default class OrderService {
    private dao: OrderDao;

    constructor(dao: OrderDao) {
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
        // TRANSACCIÓN DE BASE DE DATOS (Rápida y atómica)
        const newOrder = await withTransaction(async (session) => {

            const processedItems = await Promise.all(
                body.items.map(async (item) => {

                    // Validación de existencia de la comida
                    const food = await foodMongoDao.getById(item.foodId.toString(), session);
                    if (!food) {
                        logger.error({ foodId: item.foodId }, "Comida no encontrada al crear orden");
                        throw new NotFoundError(`No se encontró la comida con ID ${item.foodId}`);
                    }

                    // Validación de stock
                    if (food.stock < item.quantity) {
                        throw new BadRequestError(
                            `Stock insuficiente para "${food.name}". Disponible: ${food.stock}, solicitado: ${item.quantity}`
                        );
                    }

                    let optionsTotal = 0;
                    const optionsSnapshot: OrderItemOption[] = [];
                    const foodOptions: FoodOption[] = food.options ?? [];

                    const optionsMap = new Map(foodOptions.map(o => [o._id?.toString(), o]));

                    // Validar opciones requeridas
                    for (const foodOption of foodOptions) {
                        const selectedOption = item.options?.find(o => o.optionId.toString() === foodOption._id?.toString());
                        if (foodOption.required && !selectedOption) {
                            throw new BadRequestError(`Hay una opción requerida no selecionada para "${food.name}"`);
                        }
                    }

                    // Validar cada opción seleccionada y construir snapshot
                    for (const selected of item.options ?? []) {
                        const foodOption = optionsMap.get(selected.optionId.toString());
                        if (!foodOption) {
                            throw new BadRequestError(`La opción seleccionada no existe en el producto "${food.name}"`);
                        }

                        // Checkbox: múltiples valores, Radio: uno solo
                        const selectedValueIds: Types.ObjectId[] = foodOption.type === "checkbox"
                            ? selected.valueIds
                            : selected.valueIds[0] ? [selected.valueIds[0]] : [];

                        if (foodOption.type === "radio" && selectedValueIds.length !== 1) {
                            throw new BadRequestError(
                                `La opción "${foodOption.name}" es de selección única (radio) en "${food.name}"`
                            );
                        }

                        const snapshotValues: { label: string; price: number }[] = [];

                        // Construir snapshot
                        const valueMap = new Map(foodOption.values.map(v => [v._id?.toString(), v]));
                        for (const valueId of selectedValueIds) {
                            const optionValue = valueMap.get(valueId.toString());
                            if (!optionValue) {
                                throw new BadRequestError(
                                    `Valor inválido para la opción "${foodOption.name}" en "${food.name}"`
                                );
                            }
                            optionsTotal += optionValue.price;
                            snapshotValues.push({ label: optionValue.label, price: optionValue.price });
                        }

                        optionsSnapshot.push({ name: foodOption.name, values: snapshotValues });
                    }

                    // Calcula y validar precio final
                    const expectedUnitPrice = food.price + optionsTotal;
                    const expectedTotalPrice = expectedUnitPrice * item.quantity;
                    console.log(`Validando precio para "${food.name}": esperado ${expectedUnitPrice} por unidad, total esperado ${expectedTotalPrice}, precio recibido ${item.price} cantidad ${item.quantity}`);

                    if (Math.abs(item.price - expectedUnitPrice) > 0.01) {
                        throw new BadRequestError(
                            `Precio inválido para "${food.name}". Esperado: ${expectedUnitPrice}, recibido: ${item.price}`
                        );
                    }

                    // Construir item de orden con snapshot de opciones
                    const orderItem: Omit<OrderItem, "_id"> = {
                        foodId: food._id,
                        foodName: food.name,
                        quantity: item.quantity,
                        price: expectedTotalPrice,
                        options: optionsSnapshot,
                        ...(item.notes !== undefined && { notes: item.notes }),
                    };

                    return orderItem;
                })
            );

            const calculatedSubtotal = processedItems.reduce((sum, item) => sum + item.price, 0);

            const TAX_RATE = 0.10;
            const calculatedTax = parseFloat((calculatedSubtotal * TAX_RATE).toFixed(2));

            // Calculo de total de orden
            const calculatedTotal = calculatedSubtotal + calculatedTax;

            // Objeto de precios validado
            const validatedPricing: any = {
                subtotal: calculatedSubtotal,
                tax: calculatedTax,
                total: calculatedTotal
            };

            const order = await this.dao.create({ ...body, pricing: validatedPricing, items: processedItems as any }, session);

            if (body.clientId) await userMongoDao.addOrderToUser(body.clientId, order._id.toString(), session);

            return order;
        });

        // 2. OPERACIONES POST-PERSISTENCIA (Servicios Externos)
        try {
            // Invalidar caché antes de crear el payment intent para evitar que
            // stripeService.createPaymentIntent (que llama a getById internamente)
            // cachee la orden sin el paymentSecret
            await this.invalidateOrderCache(newOrder._id.toString(), body.restaurant.toString());

            const paymentData = await stripeService.createPaymentIntent(newOrder._id.toString());

            if (!paymentData || !paymentData.paymentIntentId || !paymentData.clientSecret) throw new NotFoundError("Failed to initialize payment");

            const updatedOrder = await this.dao.update(newOrder._id, {
                paymentIntentId: paymentData.paymentIntentId,
                paymentSecret: paymentData.clientSecret
            });

            // Invalidar caché nuevamente para que el checkout lea la orden actualizada con paymentSecret
            await this.invalidateOrderCache(newOrder._id.toString(), body.restaurant.toString());

            orderEvents.emitOrderCreated({
                orderId: newOrder._id,
                order: updatedOrder ?? newOrder,
                restaurant: body.restaurant,
                timestamp: new Date()
            });

            return {
                order: updatedOrder ?? newOrder,
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

    updateOrderFields = async (
        id: string,
        restaurant: string | Types.ObjectId,
        updates: { status?: OrderStatus; paymentStatus?: PaymentStatus },
        externalSession?: any
    ): Promise<OrderDB | null> => {
        const operation = async (txSession: any) => {

            if (updates.paymentStatus === "PAID") {
                const currentOrder = await this.dao.getById(id);
                if (!currentOrder) throw new NotFoundError("No se encontró el pedido");

                if (currentOrder.paymentStatus !== "PAID") {
                    await this.decreaseStock(currentOrder.items, txSession);
                }
            }

            const response = await this.dao.update(id, updates, txSession);
            if (!response) throw new NotFoundError("No se encontró el pedido");

            const orderObj = response.toObject ? response.toObject() : response;

            orderEvents.emitOrderUpdated({
                orderId: orderObj._id,
                newStatus: updates.status || orderObj.status,
                order: orderObj,
                restaurant,
                timestamp: new Date()
            });

            await this.invalidateOrderCache(orderObj._id.toString(), restaurant);
            return response;
        };

        return externalSession ? operation(externalSession) : withTransaction(operation);
    };

    // updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: ItemStatus): Promise<OrderDB | null> => {
    //     try {
    //         const checkStatus = newStatus === "DELIVERED" ? "READY" : undefined;

    //         const updatedOrder = await this.dao.updateStatusItems(orderId, itemId, newStatus, checkStatus);
    //         if (!updatedOrder) throw new NotFoundError("No se encontró la orden o el item");

    //         const orderObj = updatedOrder.toObject ? updatedOrder.toObject() : updatedOrder;

    //         orderEvents.emitItemUpdated({ orderId: orderObj._id.toString(), itemId: itemId.toString(), newStatus, order: orderObj, type: "item", restaurant: orderObj.restaurant });

    //         await this.invalidateOrderCache(orderObj._id.toString(), orderObj.restaurant.toString());
    //         return updatedOrder;

    //     } catch (error) {
    //         throw error;
    //     }
    // };

    getById = async (id: string | Types.ObjectId) => {
        const cacheKey = CACHE_KEYS.order(id.toString());
        const cached = await cache.get<OrderDB>(cacheKey);
        if (cached) return cached;

        const order = await this.dao.getById(id);
        if (order) await cache.set(cacheKey, order, CACHE_TTL.ORDER);
        return order;
    };

    getByIdClient = async (id: string | Types.ObjectId, guestId: string) => {
        const order = await this.dao.getById(id);
        if (!order) throw new NotFoundError("Orden no encontrada");
        if (order.guestId !== guestId) throw new UnauthorizedError("No tienes permiso para ver esta orden");
        return order;
    };

    getActiveRestaurant = async (restaurant: string | Types.ObjectId) => {
        const orders = await this.dao.getActiveByRestaurant(restaurant);
        if (!orders) throw new NotFoundError("Restaurante no encontrado");
        return orders;
    }

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filters: OrderFilters) => {
        return await this.dao.getByRestaurantId(restaurant, filters);
    };

}

export const orderService = new OrderService(orderMongoDao);