import MongoDao from "./mongo.dao.js";
import { OrderModel } from "./models/order.model.js";
import { OrderDB, OrderFilters } from "../../types/order.types.js";
import { CreateOrderDto } from "../../dto/order.dto.js";
import { Model, Types } from "mongoose";
import * as Sentry from "@sentry/node";
import { OrderFiltersDto } from "../../dto/order-filters.dto.js";

class OrderMongoDao extends MongoDao<OrderDB, CreateOrderDto> {
    constructor(model: Model<OrderDB>) {
        super(model);
    }

    getByIdWithPopulate = async (id: string | Types.ObjectId): Promise<OrderDB | null> => {
        return (await this.model.findById(id)
            .populate("clientId", "name profileImage")
            .lean()) as OrderDB | null;
    };

    getOrdersGuest = async (guestId: string): Promise<OrderDB[]> => {
        return (await this.model.find({ guestId }).lean()) as OrderDB[];
    }

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: string, deletionReason?: string, checkStatus?: string): Promise<OrderDB | null> => {

        Sentry.addBreadcrumb({
            category: 'order',
            message: 'Order item status update',
            data: { orderId: orderId.toString(), itemId: itemId.toString(), newStatus, deletionReason }
        });

        const query: any = { _id: orderId, "items._id": itemId };

        // Si se requiere un estado previo específico (ej: solo pasar a delivered si estaba ready)
        if (checkStatus) {
            query["items.status"] = checkStatus;
        }

        const updateFields: any = { "items.$.status": newStatus, updatedAt: new Date() };
        if (newStatus === "cancelled" && deletionReason) updateFields["items.$.deletionReason"] = deletionReason;

        const updatedOrder = await this.model.findOneAndUpdate(
            query,
            { $set: updateFields },
            { new: true }
        );

        return updatedOrder as OrderDB | null;
    };

    getByRestaurantActive = async (restaurant: string | Types.ObjectId): Promise<OrderDB[]> => {

        Sentry.addBreadcrumb({
            category: 'database',
            message: 'Orders query by restaurant (paginated)',
            data: {
                restaurantId: restaurant.toString()
            }
        });

        const query: any = { restaurant: restaurant };

        query.status = { $ne: "completed" };
        return (await this.model.find(query).lean()) as OrderDB[];
    };

    getByRestaurantId = async (
        restaurant: string | Types.ObjectId,
        filters: OrderFiltersDto & { page?: number; limit?: number }
    ): Promise<any> => {

        Sentry.addBreadcrumb({
            category: 'database',
            message: 'Orders query by restaurant (date & search)',
            data: {
                restaurantId: restaurant.toString(),
                filterKeys: Object.keys(filters)
            }
        });

        console.log(filters.toDate, filters.fromDate);

        // 1. Filtros base obligatorios (Restaurante, Estados de pago y Rango de Fecha del día)
        const query: any = {
            restaurant: restaurant,
            paymentStatus: { $in: ['PAID', 'REFOUNDED'] },
            createdAt: {
                $gte: new Date(filters.fromDate), // Viene del Mapper (00:00:00.000Z)
                $lte: new Date(filters.toDate)    // Viene del Mapper (23:59:59.999Z)
            }
        };

        // 2. Filtro por Search (Opcional - ID, usuario o items)
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

        // 3. Configuración de la paginación
        const options: any = {
            page: filters.page || 1,
            limit: filters.limit || 5,
            sort: { createdAt: -1 },
            lean: true
        };

        // 4. Ejecución de la consulta paginada
        const results = await (this.model as any).paginate(query, options);

        return results;
    };

    getActiveByRestaurant = async (restaurant: string | Types.ObjectId) => {
        Sentry.addBreadcrumb({
            category: 'database',
            message: 'Orders query by restaurant (paginated)',
            data: {
                restaurantId: restaurant.toString(),
            }
        });

        const query: any = { restaurant: restaurant };
        query.status = { $in: ["PENDING", "READY", "DELIVERED"] };
        return (await this.model.find(query).sort({ createdAt: -1 }).lean()) as OrderDB[];
    };
}

export const orderMongoDao = new OrderMongoDao(OrderModel);
