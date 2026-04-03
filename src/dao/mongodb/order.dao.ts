import MongoDao from "./mongo.dao.js";
import { OrderModel } from "./models/order.model.js";
import { OrderDB, OrderFilters } from "../../types/order.types.js";
import { CreateOrderDto } from "../../dto/order.dto.js";
import { BadRequestError } from "../../utils/custom-error.utils.js";
import { Model, Types } from "mongoose";
import * as Sentry from "@sentry/node";

class OrderMongoDao extends MongoDao<OrderDB, CreateOrderDto> {
    constructor(model: Model<OrderDB>) {
        super(model);
    }

    getByIdWithPopulate = async (id: string | Types.ObjectId): Promise<OrderDB | null> => {
        return (await this.model.findById(id)
            .populate("clientId", "name profileImage")
            .populate("waiterId", "name profileImage")
            .populate("tableId", "tableNumber status")
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

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filters: OrderFilters & { page?: number; limit?: number }): Promise<any> => {
        Sentry.addBreadcrumb({
            category: 'database',
            message: 'Orders query by restaurant (paginated)',
            data: {
                restaurantId: restaurant.toString(),
                filterKeys: Object.keys(filters)
            }
        });

        const query: any = { restaurant: restaurant };

        if (filters.status) query.status = filters.status;

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

        const results = await (this.model as any).paginate(query, options);

        return results;
    };
}

export const orderMongoDao = new OrderMongoDao(OrderModel);
