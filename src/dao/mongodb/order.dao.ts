import MongoDao from "./mongo.dao.js";
import { OrderModel } from "./models/order.model.js";
import { OrderDB, OrderFilters } from "../../types/order.js";
import { CreateOrderDto } from "../../dto/order.dto.js";
import { BadRequestError } from "../../utils/custom-error.js";
import { Model, Types } from "mongoose";
import * as Sentry from "@sentry/node";
import { getKdsStatusFromItems } from "../../utils/orders.js";

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

    getByUserId = async (userId: string | Types.ObjectId): Promise<OrderDB[]> => {
        if (!Types.ObjectId.isValid(userId)) throw new BadRequestError("ID inválido");
        return (await this.model.find({ clientId: userId }).lean()) as OrderDB[];
    };

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

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: any[], session?: any): Promise<OrderDB | null> => {

        Sentry.addBreadcrumb({
            category: 'order',
            message: 'Adding items to order and recalculating pricing',
            data: { orderId: orderId.toString(), itemsCount: items.length }
        });

        const options = session ? { new: true, session } : { new: true };

        const orderWithNewItems = await this.model.findByIdAndUpdate(
            orderId,
            { $push: { items: { $each: items } }, updatedAt: new Date() },
            options
        );

        if (!orderWithNewItems) return null;

        const subtotal = orderWithNewItems.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        const updatedOrder = await this.model.findByIdAndUpdate(
            orderId,
            { 'pricing.subtotal': subtotal, 'pricing.tax': tax, 'pricing.total': total, updatedAt: new Date() },
            { ...options, populate: [{ path: "waiterId", select: "name email role" }, { path: "tableId", select: "tableNumber status" }] }
        );

        return updatedOrder as OrderDB | null;
    };

    getTopSellingFoods = async (restaurantId: string | Types.ObjectId, dateFilter?: Date | null): Promise<any> => {
        Sentry.addBreadcrumb({
            category: 'stats',
            message: 'Calculating top selling foods aggregate',
            data: { restaurantId: restaurantId.toString() }
        });

        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        const topFoods = await this.model.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            { $match: { "items.status": { $ne: "cancelled" } } },
            {
                $group: {
                    _id: "$items.foodId",
                    foodName: { $first: "$items.foodName" },
                    quantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { quantity: -1 } },
            { $limit: 10 }
        ]);

        return topFoods;
    };

    getTotalStats = async (restaurantId: string | Types.ObjectId, dateFilter?: Date | null): Promise<any> => {
        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        const stats = await this.model.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$pricing.total" }
                }
            }
        ]);

        return stats[0] || { totalOrders: 0, totalRevenue: 0 };
    };

    getCategoryDistribution = async (restaurantId: string | Types.ObjectId, dateFilter?: Date | null): Promise<any> => {
        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        const distribution = await this.model.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            { $match: { "items.status": { $ne: "cancelled" } } },
            {
                $lookup: {
                    from: "foods",
                    localField: "items.foodId",
                    foreignField: "_id",
                    as: "foodData"
                }
            },
            { $unwind: { path: "$foodData", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "categories",
                    localField: "foodData.category",
                    foreignField: "_id",
                    as: "categoryData"
                }
            },
            { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$categoryData._id",
                    categoryName: { $first: "$categoryData.name" },
                    totalSales: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSales: -1 } }
        ]);

        const totalSales = distribution.reduce((sum, cat) => sum + cat.totalSales, 0);

        return distribution.map(cat => ({
            ...cat,
            percentage: totalSales > 0 ? Math.round((cat.totalSales / totalSales) * 100 * 100) / 100 : 0
        }));
    };

    getEvolutionData = async (restaurantId: string | Types.ObjectId, dateFilter: Date | null, format: string): Promise<any> => {
        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        return await this.model.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format, date: "$createdAt" } },
                    orders: { $sum: 1 },
                    revenue: { $sum: "$pricing.total" }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 6 }
        ]);
    };

    getWaitersRanking = async (restaurantId: string | Types.ObjectId, dateFilter?: Date | null): Promise<any> => {
        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true,
            waiterId: { $exists: true, $ne: null }
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        return await this.model.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$waiterId",
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$pricing.total" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "waiterData"
                }
            },
            { $unwind: "$waiterData" },
            {
                $project: {
                    _id: 1,
                    waiterName: "$waiterData.name",
                    waiterImage: "$waiterData.profileImage",
                    totalOrders: 1,
                    totalRevenue: 1
                }
            },
            { $sort: { totalOrders: -1 } }
        ]);
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

        if (filters.waiter) {
            if (filters.waiter === "me" && filters.currentWaiterId && Types.ObjectId.isValid(filters.currentWaiterId)) {
                query.waiterId = filters.currentWaiterId;
            } else if (filters.waiter === "others" && filters.currentWaiterId && Types.ObjectId.isValid(filters.currentWaiterId)) {
                query.waiterId = { $ne: filters.currentWaiterId };
            } else if (typeof filters.waiter === 'string' && Types.ObjectId.isValid(filters.waiter)) {
                query.waiterId = filters.waiter;
            }
        }

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

        results.docs = results.docs.map((order: any) => ({
            ...order,
            kdsStatus: getKdsStatusFromItems(order.items)
        }));

        return results;
    };
}

export const orderMongoDao = new OrderMongoDao(OrderModel);
