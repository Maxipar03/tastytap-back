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

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: string): Promise<OrderDB | null> => {
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

            console.log('Orden actualizada:', !!updatedOrder);
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
                .populate("clientId", "name profileImage")
                .populate("waiterId", "name profileImage")
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
                if (filters.waiter === "me" && filters.currentWaiterId && Types.ObjectId.isValid(filters.currentWaiterId)) {
                    query.waiterId = filters.currentWaiterId;
                } else if (filters.waiter === "others" && filters.currentWaiterId && Types.ObjectId.isValid(filters.currentWaiterId)) {
                    query.waiterId = { $ne: filters.currentWaiterId };
                } else if (typeof filters.waiter === 'string' && Types.ObjectId.isValid(filters.waiter)) {
                    query.waiterId = filters.waiter;
                }
            }

            // Filtro por rango de fechas
            if (filters.fromDate || filters.toDate) {
                console.log('Filtrando por rango de fechas', filters.fromDate, filters.toDate)
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
                
                if (Types.ObjectId.isValid(filters.search)) {
                    searchConditions.push({ _id: new Types.ObjectId(filters.search) });
                }
                searchConditions.push({ userName: searchRegex });
                searchConditions.push({ "items.foodName": searchRegex });
                
                // Combinar todos los filtros existentes con la búsqueda
                const baseQuery = { ...query };
                query.$and = [
                    baseQuery,
                    { $or: searchConditions }
                ];
            }

            // Ejecutar la consulta con los filtros
            const results = await this.model.find(query)
                .populate("waiterId", "name")
                .populate("tableId", "tableNumber")
                .sort({ createdAt: -1 })
                .lean();
            
            return results as OrderDB[];
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
            })
            .populate("clientId", "name profileImage")
            .populate("waiterId", "name profileImage");
            return orders as OrderDB[];
        } catch (error) {
            console.error("Error fetching orders by table:", error);
            throw error
        }
    };

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: any[]): Promise<OrderDB | null> => {
        try {
            if (!Types.ObjectId.isValid(orderId)) throw new BadRequestError("ID inválido");
            
            // Primero añadir los items
            const orderWithNewItems = await this.model.findByIdAndUpdate(
                orderId,
                { 
                    $push: { items: { $each: items } },
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!orderWithNewItems) return null;

            // Recalcular el pricing basándose en todos los items
            const subtotal = orderWithNewItems.items.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            const tax = subtotal * 0.08; // 8% de impuesto, ajusta según tu necesidad
            const total = subtotal + tax;

            // Actualizar el pricing completo
            const updatedOrder = await this.model.findByIdAndUpdate(
                orderId,
                { 
                    'pricing.subtotal': subtotal,
                    'pricing.tax': tax,
                    'pricing.total': total,
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