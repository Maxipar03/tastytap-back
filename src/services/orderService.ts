import { orderMongoDao } from "../daos/mongodb/orderDao.js";
import { foodMongoDao } from "../daos/mongodb/foodDao.js";
import { getIO } from "../config/socket.js";
import { CustomError, NotFoundError, OrderReadyError } from "../utils/customError.js";
import { CreateOrderDto } from "../DTO/orderDto.js";
import { OrderFilters } from "../types/order.js";
import { UserModel } from "../daos/mongodb/models/userModel.js";
import { OrderDao, OrderDB, OrderStatus, CreateOrderResponse } from "../types/order.js";
import { Types, startSession } from "mongoose";
import generateToken from "../utils/generateToken.js";
import { tableServices } from "./tableService.js";
import { tableSessionService } from "./tableSessionService.js";
import logger from "../utils/logger.js";
export default class OrderService {

    private dao: OrderDao

    constructor(dao: OrderDao) {
        this.dao = dao;
    }

    private decreaseStock = async (items: Array<any>, session?: any): Promise<void> => {
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

                logger.debug({ 
                    foodId: item.foodId, 
                    foodName: food.name, 
                    quantity: item.quantity, 
                    previousStock: food.stock 
                }, "Reduciendo stock de producto");
                
                await foodMongoDao.decreaseStock(item.foodId, item.quantity, session);
            }
        }
    }

    create = async (body: CreateOrderDto, orderId: string): Promise<CreateOrderResponse> => {
        const session = await startSession();
        session.startTransaction();
        
        try {
            const logContext = {
                restaurantId: body.restaurant,
                orderType: body.orderType,
                tableId: body.tableId,
                clientId: body.clientId,
                itemsCount: body.items?.length,
                total: body.pricing.total
            };

            if (orderId) {
                logger.info({ ...logContext, existingOrderId: orderId }, "Agregando items a orden existente");
                const updatedOrder = await this.addItemsToOrder(orderId, body.items, session);
                if (!updatedOrder) throw new CustomError("Error al agregar items a la orden", 500);
                
                await session.commitTransaction();
                const orderToken = generateToken({ orderId: updatedOrder._id }, "7d");
                return { order: updatedOrder, token: orderToken };
            }

            logger.info(logContext, "Creando nueva orden con transacción");
            await this.decreaseStock(body.items, session);

            const response = await this.dao.create(body, session);
            if (!response) {
                logger.error(logContext, "Error al crear orden en base de datos");
                throw new CustomError("Error al crear el plato", 500);
            }

            // Si es dine-in y tiene tableId, manejar sesión de mesa
            if (body.orderType === "dine-in" && body.tableId) {
                const table = await tableServices.getById(body.tableId);

                let sessionId = table?.activeSession;
                logger.debug({ tableId: body.tableId, sessionId }, "Verificando sesión activa de mesa");
                if (!sessionId) {
                    const newSession = await tableSessionService.createSession(body.restaurant, body.tableId);
                    sessionId = newSession._id;
                    await tableServices.update(body.tableId, { activeSession: sessionId }, body.restaurant);
                }

                await tableSessionService.addOrderToSession(sessionId, response._id);
            }

            const populatedOrder = await response
                .populate([
                    { path: "waiterId", select: "name email role profileImage" },
                    {
                        path: "tableId",
                        select: "tableNumber status waiterServing",
                        populate: {
                            path: "waiterServing",
                            select: "name email role profileImage"
                        }
                    },
                ]);

            if (body.clientId) {
                logger.debug({ clientId: body.clientId, orderId: response._id }, "Asociando orden a cliente");
                await UserModel.findByIdAndUpdate(body.clientId, { $push: { orders: response._id } }, { session });
            }

            await session.commitTransaction();
            const orderToken = generateToken({ orderId: populatedOrder._id }, "7d")
            const io = getIO();

            logger.info({ 
                orderId: populatedOrder._id, 
                restaurantId: body.restaurant, 
                waiterId: body.waiterId,
                total: populatedOrder.pricing.total 
            }, "Orden creada exitosamente - enviando notificaciones");

            // 🔔 Emitir al mozo asignado
            if (body.waiterId) {
                logger.debug({ waiterId: body.waiterId, orderId: populatedOrder._id }, "Notificando a mesero");
                io.to(`waiter-${body.waiterId}`).emit("nueva-orden", {
                    order: populatedOrder,
                    timestamp: new Date()
                });
            }

            // 🍽️ Emitir a la cocina y administración
            logger.debug({ restaurantId: body.restaurant, orderId: populatedOrder._id }, "Notificando a restaurante");
            io.to(`restaurant-${body.restaurant}`).emit("nueva-orden", {
                order: populatedOrder,
                timestamp: new Date()
            });

            // 📱 Emitir notificación específica por ID de orden
            io.to(`order-${populatedOrder._id}`).emit("nueva-orden", {
                orderId: populatedOrder._id,
                order: populatedOrder,
                timestamp: new Date()
            });

            return { order: populatedOrder, token: orderToken };

        } catch (error) {
            await session.abortTransaction();
            logger.error({ error }, "Error en transacción de creación de orden - rollback ejecutado");
            throw error;
        } finally {
            session.endSession();
        }
    };

    updateStatusOrder = async (id: string, body: Partial<OrderDB>, restaurant: string | Types.ObjectId): Promise<OrderDB | null> => {
        const session = await startSession();
        session.startTransaction();
        
        try {
            const response = await this.dao.update(id, body, session);
            if (!response) {
                throw new NotFoundError("No se encontro el plato");
            }

            // Verificar si la orden está completada y es la última de la mesa (solo para dine-in)
            if (body.status === "cashed" && response.orderType === "dine-in" && response.tableId) {
                const table = await tableServices.getById(response.tableId);

                if (table?.activeSession) {
                    const tableSession = await tableSessionService.getActiveSession(response.tableId);

                    if (tableSession) {
                        const sessionOrders = await Promise.all(
                            tableSession.orders.map(orderId => this.dao.getById(orderId))
                        );

                        const allOrdersCashed = sessionOrders.every(order => order?.status === "cashed");

                        logger.debug({ 
                            sessionId: tableSession._id, 
                            tableId: response.tableId, 
                            allOrdersCashed, 
                            ordersCount: sessionOrders.length 
                        }, "Verificando si todas las órdenes de la sesión están cobradas");

                        if (allOrdersCashed) {
                            logger.info({ 
                                sessionId: tableSession._id, 
                                tableId: response.tableId, 
                                restaurantId: restaurant 
                            }, "Cerrando sesión de mesa - todas las órdenes cobradas");
                            
                            await tableSessionService.closeSession(tableSession._id);
                            await tableServices.update(response.tableId, {
                                state: "available",
                                waiterServing: null,
                                activeSession: null
                            }, restaurant);
                        }
                    }
                }
            }

            await session.commitTransaction();

            const io = getIO();

            // Notificar cambio específico por ID de orden
            io.to(`order-${response._id}`).emit("estado-orden-actualizado", {
                orderId: response._id,
                newStatus: body.status || response.status,
                order: response,
                timestamp: new Date()
            }) ;

            // 🍽️ Emitir a la cocina y administración
            io.to(`restaurant-${restaurant}`).emit("estado-orden-actualizado", {
                order: response,
                timestamp: new Date()
            });

            return response;
        } catch (error) {
            await session.abortTransaction();
            logger.error({ error, orderId: id }, "Error en transacción de actualización de orden - rollback ejecutado");
            throw error;
        } finally {
            session.endSession();
        }
    };

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filters: OrderFilters & { page?: number; limit?: number }): Promise<any | null> => {
        try {
            const response = await this.dao.getByRestaurantId(restaurant, filters);
            if (!response) throw new NotFoundError("No se encontro el pedido");
            return response;
        } catch (error) {
            throw error;
        }
    };

    getByUserId = async (userId: string | Types.ObjectId): Promise<OrderDB[] | null> => {
        try {
            const response = await this.dao.getByUserId(userId);
            if (!response) throw new NotFoundError("No se encontro el pedido");
            return response;
        } catch (error) {
            throw error
        }
    };

    // callWaiter = async (tableId: string | Types.ObjectId, waiterId: string | Types.ObjectId) => {
    //     try {
    //         const io = getIO();

    //         io.to(`waiter-${waiterId}`).emit("llamada-mesa", {
    //             tableId: tableId,
    //             timestamp: new Date(),
    //             message: `La mesa ${tableId} necesita atención`
    //         });

    //         return { success: true, message: "Llamada enviada al mozo" };

    //     } catch (error) {
    //         throw error
    //     }
    // }

    getById = async (id: string | Types.ObjectId): Promise<OrderDB | null> => {
        try {
            const response = await this.dao.getById(id);
            if (!response) throw new NotFoundError("No se encontró la orden");
            return response;
        } catch (error) {
            throw error;
        }
    };

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: OrderStatus, deletionReason?: string): Promise<OrderDB | null> => {
        try {
            // Validar que solo se pueda cambiar a delivered si el item está ready
            if (newStatus === "delivered") {
                const currentOrder = await this.dao.getById(orderId)
                if (!currentOrder) throw new NotFoundError("No se encontró la orden")

                const item = currentOrder.items.find(item => item._id?.toString() === itemId.toString())

                if (!item) throw new CustomError("No se encontró el item", 404)
                if (item.status !== "ready") throw new CustomError("Solo se puede marcar como entregado un item que esté listo", 400)
            }

            const updatedOrder = await this.dao.updateStatusItems(orderId, itemId, newStatus, deletionReason)
            if (!updatedOrder) throw new CustomError("No se encontró la orden o el item", 404)

            // Verificar si todos los items están delivered o cancelled
            const allItemsCompleted = updatedOrder.items.every(item =>
                item.status === "delivered" || item.status === "cancelled"
            )

            // Si todos los items están completados, cambiar el estado de la orden a delivered
            if (allItemsCompleted && updatedOrder.status !== "delivered") {
                const orderWithNewStatus = await this.updateStatusOrder(orderId.toString(), { status: "delivered" }, updatedOrder.restaurant)
                if (orderWithNewStatus) updatedOrder.status = "delivered"
            }

            if (newStatus === "cancelled") {
                const activeItems = updatedOrder.items.filter(item => item.status !== "cancelled")

                const newSubtotal = activeItems.reduce(
                    (subtotal, item) => subtotal + (item.price * item.quantity),
                    0
                )
                const newTax = newSubtotal * 0.08 // 8% de impuesto
                const newTotal = newSubtotal + newTax

                // Actualizar en la DB
                await this.dao.update(orderId.toString(), {
                    "pricing.subtotal": newSubtotal,
                    "pricing.tax": newTax,
                    "pricing.total": newTotal
                } as any)

                // Reflejar en el objeto que ya tenés cargado
                if (!(updatedOrder as any).pricing) {
                    (updatedOrder as any).pricing = {}
                }
                (updatedOrder as any).pricing.subtotal = newSubtotal as number
                (updatedOrder as any).pricing.tax = newTax as number
                (updatedOrder as any).pricing.total = newTotal
            }

            const io = getIO()


            io.to(`order-${updatedOrder._id}`).emit("estado-item-actualizado", {
                orderId,
                itemId,
                newStatus,
                tableId: updatedOrder.tableId,
                order: updatedOrder,
                type: "item",
            })

            io.to(`restaurant-${updatedOrder.restaurant}`).emit("estado-item-actualizado", {
                orderId,
                itemId,
                newStatus,
                tableId: updatedOrder.tableId,
                order: updatedOrder,
                type: "item",
            })

            return updatedOrder;

        } catch (error) {
            throw error
        }
    }

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: any[], session?: any): Promise<OrderDB | null> => {
        const useExternalSession = !!session;
        if (!session) {
            session = await startSession();
            session.startTransaction();
        }
        
        try {
            // Verificar el estado actual de la orden
            const currentOrder = await this.dao.getById(orderId);

            if (!currentOrder) throw new NotFoundError("No se encontró la orden");
            // Si la orden está lista, lanzar error
            if (currentOrder.status === "cashed")  throw new OrderReadyError();

            // Descontar stock de cada item nuevo
            await this.decreaseStock(items, session);

            const updatedOrder = await this.dao.addItemsToOrder(orderId, items, session);
            if (!updatedOrder) throw new NotFoundError("No se encontró la orden");

            if (!useExternalSession) await session.commitTransaction();
            

            const io = getIO();

            io.to(`order-${updatedOrder._id}`).emit("items-agregados", {
                order: updatedOrder,
                timestamp: new Date()
            });

            io.to(`restaurant-${updatedOrder.restaurant}`).emit("items-agregados", {
                order: updatedOrder,
                timestamp: new Date()
            });

            return updatedOrder;
        } catch (error) {
            if (!useExternalSession) {
                await session.abortTransaction();
                logger.error({ error, orderId }, "Error en transacción de agregar items - rollback ejecutado");
            }
            throw error;
        } finally {
            if (!useExternalSession) session.endSession();
            
        }
    };

}

export const orderService = new OrderService(orderMongoDao);