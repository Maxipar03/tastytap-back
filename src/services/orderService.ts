import { orderMongoDao } from "../daos/mongodb/orderDao.js";
import { foodMongoDao } from "../daos/mongodb/foodDao.js";
import { getIO } from "../config/socket.js";
import { CustomError, NotFoundError, OrderReadyError } from "../utils/customError.js";
import { CreateOrderDto } from "../DTO/orderDto.js";
import { OrderFilters } from "../types/order.js";
import { UserModel } from "../daos/mongodb/models/userModel.js";
import { OrderDao, OrderDB, OrderStatus, CreateOrderResponse } from "../types/order.js";
import { Types } from "mongoose";
import generateToken from "../utils/generateToken.js";
import { tableServices } from "./tableService.js";

export default class OrderService {

    private dao: OrderDao

    constructor(dao: OrderDao) {
        this.dao = dao;
    }

    create = async (body: CreateOrderDto): Promise<CreateOrderResponse> => {
        try {

            const userId = body.clientId;

            // Descontar stock de cada item
            for (const item of body.items) {
                if (item.foodId) {
                    const food = await foodMongoDao.getById(item.foodId.toString());
                    if (food && food.stock > 0 && food.stock >= item.quantity) await foodMongoDao.decreaseStock(item.foodId, item.quantity);
                    if (food && food.stock <= 0 && food.stock <= item.quantity) throw new OrderReadyError(`No hay suficiente stock de ${food.name} para completar la orden`);

                }
            }

            const response = await this.dao.create(body);
            if (!response) throw new CustomError("Error al crear el plato", 500);

            if (userId) await UserModel.findByIdAndUpdate(userId, { $push: { orders: response._id } });

            const populatedOrder = await response
                .populate([
                    { path: "waiterId", select: "name email role profileImage" },
                    { path: "tableId", select: "tableNumber status" },
                ])

            const orderToken = generateToken({ orderId: populatedOrder._id })
            const io = getIO();

            console.log(body)

            // 🔔 Emitir al mozo asignado
            if (body.waiterId) {
                io.to(`waiter-${body.waiterId}`).emit("nueva-orden", {
                    order: populatedOrder,
                    timestamp: new Date()
                });
            }


            // 🍽️ Emitir a la cocina y administración
            io.to(`restaurant-${body.restaurant}`).emit("nueva-orden", {
                order: populatedOrder,
                timestamp: new Date()
            });

            return { order: populatedOrder, token: orderToken };

        } catch (error) {
            throw error;
        };
    };

    updateStatusOrder = async (id: string, body: Partial<OrderDB>, restaurant: string | Types.ObjectId): Promise<OrderDB | null> => {
        try {
            const response = await this.dao.update(id, body);
            if (!response) throw new NotFoundError("No se encontro el plato");

            // Verificar si la orden está completada y es la última de la mesa
            if (body.status === "ready") {
                const tableOrders = await this.dao.getByTableId(response.tableId);
                const activeOrders = tableOrders.filter(order =>
                    order._id.toString() !== id &&
                    order.status !== "ready"
                );

                // Si no hay más órdenes activas, liberar la mesa
                if (activeOrders.length === 0) {
                    await tableServices.update(response.tableId, { state: "available", waiterServing: null }, restaurant);
                }
            }

            const io = getIO();

            console.log(response)

            // 🍽️ Emitir a la cocina y administración
            io.to(`restaurant-${restaurant}`).emit("estado-orden-actualizado", {
                order: response,
                timestamp: new Date()
            });

            return response;
        } catch (error) {
            throw error;
        }
    };

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filters: OrderFilters): Promise<OrderDB[] | null> => {
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

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: OrderStatus): Promise<OrderDB | null> => {
        try {
            const updatedOrder = await this.dao.updateStatusItems(orderId, itemId, newStatus)
            if (!updatedOrder) throw new CustomError("No se encontró la orden o el item", 404)

            if (newStatus === "cancelled") {
                const activeItems = updatedOrder.items.filter(item => item.status !== "cancelled")

                const newSubtotal = activeItems.reduce(
                    (subtotal, item) => subtotal + (item.price * item.quantity),
                    0
                )
                const newTax = newSubtotal * 0.08 // 8% de impuesto
                const newTotal = newSubtotal + newTax

                // Actualizar en la DB
                await this.dao.update(orderId, {
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

            const { restaurant, waiterId } = updatedOrder

            const io = getIO()

            // 👨‍🍳 Emitir al restaurante
            io.to(`restaurant-${restaurant}`).emit("estado-item-actualizado", {
                orderId,
                itemId,
                newStatus,
                tableId: updatedOrder.tableId,
                order: updatedOrder,
                type: "item",
            })

            // 🙋‍♂️ Emitir al mozo si está definido
            if (waiterId) {
                io.to(`waiter-${waiterId}`).emit("estado-item-actualizado", {
                    orderId,
                    itemId,
                    newStatus,
                    tableId: updatedOrder.tableId,
                    order: updatedOrder,
                    type: "item",
                })
            }

            return updatedOrder;

        } catch (error) {
            throw error
        }
    }

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: any[]): Promise<OrderDB | null> => {
        try {
            // Verificar el estado actual de la orden
            const currentOrder = await this.dao.getById(orderId);
            if (!currentOrder) throw new NotFoundError("No se encontró la orden");

            // Si la orden está lista, lanzar error
            if (currentOrder.status === "ready") {
                throw new OrderReadyError();
            }

            // Descontar stock de cada item nuevo
            for (const item of items) {
                if (item.foodId) {
                    const food = await foodMongoDao.getById(item.foodId.toString());
                    if (food && food.stock > 0 && food.stock >= item.quantity) await foodMongoDao.decreaseStock(item.foodId, item.quantity);
                    if (food && food.stock <= 0 && food.stock <= item.quantity) throw new OrderReadyError(`No hay suficiente stock de ${food.name} para completar la orden`);
                }
            }

            const updatedOrder = await this.dao.addItemsToOrder(orderId, items);
            if (!updatedOrder) throw new NotFoundError("No se encontró la orden");

            const io = getIO();

            // Emitir al mozo y restaurante
            if (updatedOrder.waiterId) {
                io.to(`waiter-${updatedOrder.waiterId}`).emit("items-agregados", {
                    order: updatedOrder,
                    timestamp: new Date()
                });
            }

            io.to(`restaurant-${updatedOrder.restaurant}`).emit("items-agregados", {
                order: updatedOrder,
                timestamp: new Date()
            });

            return updatedOrder;
        } catch (error) {
            throw error;
        }
    };

}

export const orderService = new OrderService(orderMongoDao);