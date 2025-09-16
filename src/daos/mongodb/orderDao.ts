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

    updateStatusItems = async (itemId: string | Types.ObjectId, orderId: string | Types.ObjectId, newStatus: string): Promise<OrderDB | null> => {
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


            return updatedOrder as OrderDB | null
        } catch (error) {
            console.error("Error fetching orders by restaurant:", error);
            throw error
        }
    }

    getById = async (id: string | Types.ObjectId): Promise<OrderDB | null> => {
        try {
            if (!Types.ObjectId.isValid(id)) throw new BadRequestError("ID inválido");
            return (await this.model.findById(id)
                .populate("waiterId", "name email role")
                .populate("tableId", "tableNumber status")
                .lean()) as OrderDB | null;
        } catch (error) {
            throw error
        }
    };

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filters: OrderFilters): Promise<OrderDB[]> => {
        try {

            if (!Types.ObjectId.isValid(restaurant)) throw new BadRequestError("ID inválido");

            // Construir el objeto de consulta dinámicamente
            const query: any = { restaurant: restaurant };

            // Filtro por status de la orden (no de los items)
            if (filters.status) {
                query.status = filters.status;
            }

            // Filtro por mozo
            if (filters.waiter) {
                if (filters.waiter === "me" && filters.currentWaiterId) {
                    query.waiterId = filters.currentWaiterId;
                } else if (filters.waiter === "others" && filters.currentWaiterId) {
                    query.waiterId = { $ne: filters.currentWaiterId };
                } else if (typeof filters.waiter === 'string' && Types.ObjectId.isValid(filters.waiter)) {
                    query.waiterId = filters.waiter;
                }
                // Si waiter es "all", no agregamos filtro de waiterId
            }

            // Filtro por rango de fechas
            if (filters.fromDate || filters.toDate) {
                query.createdAt = {};
                if (filters.fromDate) {
                    query.createdAt.$gte = new Date(filters.fromDate);
                }
                if (filters.toDate) {
                    const endOfDay = new Date(filters.toDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = endOfDay;
                }
            }

            // Filtro de búsqueda por texto
            if (filters.search) {
                const searchRegex = new RegExp(filters.search, 'i');
                const searchConditions = [];
                
                // Buscar por ID de orden si es un ObjectId válido
                if (Types.ObjectId.isValid(filters.search)) {
                    searchConditions.push({ _id: new Types.ObjectId(filters.search) });
                }
                
                // Buscar por nombre de usuario
                searchConditions.push({ userName: searchRegex });
                
                // Buscar por nombre de comida en items
                searchConditions.push({ "items.foodName": searchRegex });
                
                if (searchConditions.length > 0) {
                    query.$or = searchConditions;
                }
            }

            console.log('Query MongoDB:', JSON.stringify(query, null, 2));

            // Ejecutar la consulta con los filtros
            return (await this.model.find(query)
                .populate("waiterId", "name")
                .populate("tableId", "tableNumber")
                .sort({ createdAt: -1 })
                .lean()) as OrderDB[];
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

    getByTableId = async (tableId: string | Types.ObjectId): Promise<OrderDB[]> => {
        try {
            if (!Types.ObjectId.isValid(tableId)) throw new BadRequestError("ID inválido");
            const orders = await this.model.find({
                tableId,
                status: "pending"
            });
            return orders as OrderDB[];
        } catch (error) {
            console.error("Error fetching orders by table:", error);
            throw error
        }
    };

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: any[]): Promise<OrderDB | null> => {
        try {
            if (!Types.ObjectId.isValid(orderId)) throw new BadRequestError("ID inválido");
            
            const updatedOrder = await this.model.findByIdAndUpdate(
                orderId,
                { 
                    $push: { items: { $each: items } },
                    updatedAt: new Date()
                },
                { new: true }
            ).populate([
                { path: "waiterId", select: "name email role" },
                { path: "tableId", select: "tableNumber status" }
            ]);
            
            return updatedOrder as OrderDB | null;
        } catch (error) {
            throw error;
        }
    };

}

export const orderMongoDao = new OrderMongoDao(OrderModel);