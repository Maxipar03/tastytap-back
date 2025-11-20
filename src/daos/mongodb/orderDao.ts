import MongoDao from "./mongoDao.js";
import { OrderModel } from "./models/orderModel.js";
import { OrderDB } from "../../types/order.js";
import { CreateOrderDto } from "../../DTO/orderDto.js";
import { BadRequestError } from "../../utils/customError.js";
import { OrderFilters } from "../../types/order.js";
import { Model, Types } from "mongoose";
import * as Sentry from "@sentry/node";

class OrderMongoDao extends MongoDao<OrderDB, CreateOrderDto> {
    constructor(model: Model<OrderDB>) {
        super(model);
    }

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: string, deletionReason?: string): Promise<OrderDB | null> => {
        try {

            if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(itemId)) throw new BadRequestError("ID inválido");

            Sentry.addBreadcrumb({
                category: 'order',
                message: 'Order item status update',
                data: {
                    orderId: orderId.toString(),
                    itemId: itemId.toString(),
                    newStatus,
                    deletionReason
                }
            });

            const updateFields: any = {
                "items.$.status": newStatus,
                updatedAt: new Date(),
            };

            if (newStatus === "cancelled" && deletionReason) {
                updateFields["items.$.deletionReason"] = deletionReason;
            }

            const updatedOrder = await this.model.findOneAndUpdate(
                {
                    _id: orderId,
                    "items._id": itemId,
                },
                {
                    $set: updateFields,
                },
                { new: true },
            )

            return updatedOrder as OrderDB | null
        } catch (error) {
            throw error
        }
    }

    getById = async (id: string | Types.ObjectId): Promise<OrderDB | null> => {
        try {
            if (!Types.ObjectId.isValid(id)) throw new BadRequestError("ID inválido");
            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Executing getById query with populate',
                data: { collection: this.model.collection.name, id: id.toString() }
            });
            return (await this.model.findById(id)
                .populate("clientId", "name profileImage")
                .populate("waiterId", "name profileImage")
                .populate("tableId", "tableNumber status")
                .lean()) as OrderDB | null;
        } catch (error) {
            throw error
        }
    };

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filters: OrderFilters & { page?: number; limit?: number }): Promise<any> => {
        try {

            if (!Types.ObjectId.isValid(restaurant)) throw new BadRequestError("ID inválido");

            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Orders query by restaurant (paginated)',
                data: {
                    restaurantId: restaurant.toString(),
                    filterKeys: Object.keys(filters)
                }
            });

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
                const searchConditions = [];

                if (Types.ObjectId.isValid(filters.search)) {
                    searchConditions.push({ _id: new Types.ObjectId(filters.search) });
                } else {
                    const searchRegex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                    searchConditions.push({ userName: searchRegex });
                    searchConditions.push({ "items.foodName": searchRegex });
                }

                query.$or = searchConditions;
            }

            // Configurar opciones de paginación
            const options: any = {
                page: filters.page || 1,
                limit: filters.limit || 5,
                populate: [
                    { path: "waiterId", select: "name" },
                    { path: "tableId", select: "tableNumber" }
                ],
                sort: { createdAt: -1 },
                lean: true
            };

            // Ejecutar la consulta paginada con los filtros
            const results = await (this.model as any).paginate(query, options);

            return results;
        } catch (error) {
            throw error
        }
    };

    getByUserId = async (userId: string | Types.ObjectId): Promise<OrderDB[]> => {
        try {
            if (!Types.ObjectId.isValid(userId)) throw new BadRequestError("ID inválido");
            Sentry.addBreadcrumb({
                category: 'database',
                message: 'Executing getById query with populate',
                data: { collection: this.model.collection.name, userId: userId.toString() }
            });
            return (await this.model.find({ clientId: userId }).lean()) as OrderDB[];
        } catch (error) {
            throw error
        }
    };

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: any[], session?: any): Promise<OrderDB | null> => {
        try {
            if (!Types.ObjectId.isValid(orderId)) throw new BadRequestError("ID inválido");

            Sentry.addBreadcrumb({
                category: 'order',
                message: 'Adding items to order and recalculating pricing',
                data: {
                    orderId: orderId.toString(),
                    itemsCount: items.length
                }
            });

            const options = session ? { new: true, session } : { new: true };

            // Primero añadir los items
            const orderWithNewItems = await this.model.findByIdAndUpdate(
                orderId,
                {
                    $push: { items: { $each: items } },
                    updatedAt: new Date()
                },
                options
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
                {
                    ...options, populate: [
                        { path: "waiterId", select: "name email role" },
                        { path: "tableId", select: "tableNumber status" }
                    ]
                }
            );

            return updatedOrder as OrderDB | null;
        } catch (error) {
            throw error;
        }
    };

}

export const orderMongoDao = new OrderMongoDao(OrderModel);