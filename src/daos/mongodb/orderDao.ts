import MongoDao from "./mongoDao.js";
import { OrderModel } from "./models/orderModel.js";
import { OrderDB } from "../../types/order.js";
import { CreateOrderDto } from "../../DTO/orderDto.js";
import { BadRequestError } from "../../utils/customError.js";
import { OrderFilters } from "../../types/order.js";
import { Model } from "mongoose";
import { Types } from "mongoose";

class OrderMongoDao extends MongoDao<OrderDB, CreateOrderDto> {
    constructor(model: Model<OrderDB>) {
        super(model);
    }

    updateStatus = async (itemId: string | Types.ObjectId, orderId: string | Types.ObjectId, newStatus: string): Promise<OrderDB | null> => {
        try {

            if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(itemId)) throw new BadRequestError("ID inválido");

            const updatedOrder = await this.model.findOneAndUpdate(
                {
                    _id: orderId,
                    "items._id": itemId,
                },
                {
                    $set: {
                        "items.$.status": newStatus,
                        updatedAt: new Date(),
                    },
                },
                { new: true },
            )
                .populate("items.food");

            return updatedOrder as OrderDB | null
        } catch (error) {
            console.error("Error fetching orders by restaurant:", error);
            throw error
        }
    }

    getByRestaurantId = async (restaurant: string | Types.ObjectId,  filters: OrderFilters): Promise<OrderDB[]> => {
        try {

            if (!Types.ObjectId.isValid(restaurant)) throw new BadRequestError("ID inválido");

            // 🆕 Construir el objeto de consulta dinámicamente
            const query: any = { restaurant: restaurant };

            if (filters.status) {
                query["items.status"] = filters.status;
            }

            // 🆕 Filtro por mozo
            if (filters.waiter) {
                if (filters.waiter === "me" && filters.currentWaiterId) {
                    query.waiterId = filters.currentWaiterId;
                } else if (filters.waiter === "others" && filters.currentWaiterId) {
                    query.waiterId = { $ne: filters.currentWaiterId };
                }
            }

            // 🆕 Filtro por rango de fechas
            if (filters.fromDate || filters.toDate) {
                query.createdAt = {};
                if (filters.fromDate) {
                    query.createdAt.$gte = new Date(filters.fromDate);
                }
                if (filters.toDate) {
                    // Agrega 23 horas, 59 minutos y 59 segundos para incluir todo el día
                    const endOfDay = new Date(filters.toDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = endOfDay;
                }
            }

            // 🔍 Filtro de búsqueda por texto
            if (filters.search) {
                const searchRegex = new RegExp(filters.search, 'i');
                query.$or = [
                    { _id: Types.ObjectId.isValid(filters.search) ? new Types.ObjectId(filters.search) : null },
                    { userName: searchRegex },
                    { "items._id": Types.ObjectId.isValid(filters.search) ? new Types.ObjectId(filters.search) : null }
                ].filter(condition => condition._id !== null || condition.userName || condition["items._id"] !== null);
            }

            // 🆕 Ejecutar la consulta con los filtros
            return (await this.model.find(query).populate("items.food", "name").populate("waiterId", "name").lean()) as OrderDB[];
        } catch (error) {
            console.error("Error fetching orders by restaurant:", error);
            throw error
        }
    };

    getByUserId = async (userId: string | Types.ObjectId): Promise<OrderDB[]> => {
        try {
            if (!Types.ObjectId.isValid(userId)) throw new BadRequestError("ID inválido");
            return (await this.model.find({ clientId: userId }).lean()) as OrderDB[];
        } catch (error) {
            console.error("Error fetching orders by restaurant:", error);
            throw error
        }
    };

    getBySeatId = async (seatId: string | Types.ObjectId): Promise<OrderDB[]> => {
        try {
            if (!Types.ObjectId.isValid(seatId)) throw new BadRequestError("ID inválido");
            const orders = await this.model.find({ seatId }).populate("items.food", "name price");
            return orders as OrderDB[];
        } catch (error) {
            console.error("Error fetching orders by restaurant:", error);
            throw error
        }
    };

}

export const orderMongoDao = new OrderMongoDao(OrderModel);