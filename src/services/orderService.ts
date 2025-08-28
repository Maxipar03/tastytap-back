import { orderMongoDao } from "../daos/mongodb/orderDao.js";
import { getIO } from "../config/socket.js";
import { CustomError, NotFoundError } from "../utils/customError.js";
import { CreateOrderDto } from "../DTO/orderDto.js";
import { OrderFilters } from "../types/order.js";
import { UserModel } from "../daos/mongodb/models/userModel.js";
import { OrderDao, OrderDB, OrderStatus } from "../types/order.js";
import { Types } from "mongoose";

export default class OrderService {

    private dao: OrderDao
    
    constructor(dao: OrderDao) {
        this.dao = dao;
    }

    create = async (body: CreateOrderDto): Promise<OrderDB> => {
        try {

            const userId = body.clientId
            const seatId = body.seatId

            const response = await this.dao.create(body);
            if (!response) throw new CustomError("Error al crear el plato", 500);

            const populatedOrder = await response.populate("items.food");

            console.log(userId, response._id)

            if (userId) {
                await UserModel.findByIdAndUpdate(userId, { $push: { orders: response._id } });
            }

            const io = getIO();

            // 🔔 Emitir al mozo asignado
            if (body.waiterId) {
                io.to(`waiter-${body.waiterId}`).emit("nuevo-pedido", {
                    order: populatedOrder,
                    seatId: seatId,
                    timestamp: new Date()
                });
            }


            // 🍽️ Emitir a la cocina y administración
            io.to(`restaurant-${body.restaurant._id}`).emit("nuevo-pedido", {
                order: populatedOrder,
                seatId: seatId,
                timestamp: new Date()
            });

            return populatedOrder;

        } catch (error) {
            throw error;
        };
    };

    update = async (id:string, body: Partial<OrderDB> ): Promise<OrderDB | null> => {
        try {
            const response = await this.dao.update(id, body);
            if (!response) throw new NotFoundError("No se encontro el plato");
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

    callWaiter = async (tableId: string | Types.ObjectId, waiterId: string | Types.ObjectId) => {
        try {
            const io = getIO();

            io.to(`waiter-${waiterId}`).emit("llamada-mesa", {
                tableId: tableId,
                timestamp: new Date(),
                message: `La mesa ${tableId} necesita atención`
            });

            return { success: true, message: "Llamada enviada al mozo" };

        } catch (error) {
            throw error
        }
    }

    updateStatus = async (itemId:string | Types.ObjectId, orderId:string | Types.ObjectId, newStatus: OrderStatus): Promise<OrderDB | null> => {
        try {

            const updatedOrder = await this.dao.updateStatus(itemId, orderId, newStatus)
            if (!updatedOrder) throw new CustomError("No se encontró la orden o el item", 404)

            const { restaurant, waiterId, seatId } = updatedOrder

            const io = getIO()

            // 👨‍🍳 Emitir al restaurante
            io.to(`restaurant-${restaurant}`).emit("estado-item-actualizado", {
                orderId,
                itemId,
                newStatus,
                seatId,
                order: updatedOrder,
                type: "item",
            })

            // 🙋‍♂️ Emitir al mozo si está definido
            if (waiterId) {
                io.to(`waiter-${waiterId}`).emit("estado-item-actualizado", {
                    orderId,
                    itemId,
                    newStatus,
                    seatId,
                    order: updatedOrder,
                    type: "item",
                })
            }

            return updatedOrder;

        } catch (error) {
            throw error
        }
    }

}

export const orderService = new OrderService(orderMongoDao);