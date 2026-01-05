import { BaseRepository } from "./base.repository.js";
import { OrderDB, OrderFilters } from "../types/order.js";
import { CreateOrderDto } from "../dto/order.dto.js";
import { orderMongoDao } from "../dao/mongodb/order.dao.js";
import { Types } from "mongoose";
import { OrderModel } from "../dao/mongodb/models/order.model.js";
import { BadRequestError } from "../utils/custom-error.js";
import * as Sentry from "@sentry/node";
import { getKdsStatusFromItems } from "../utils/orders.js";

class OrderRepository extends BaseRepository<OrderDB, CreateOrderDto> {
    constructor() {
        super(orderMongoDao);
    }

    async getTopSellingFoods(restaurantId: string | Types.ObjectId, dateFilter?: Date | null): Promise<any> {

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

        const topFoods = await OrderModel.aggregate([
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
    }

    async getTotalStats(restaurantId: string | Types.ObjectId, dateFilter?: Date | null): Promise<any> {

        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        const stats = await OrderModel.aggregate([
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
    }

    async getCategoryDistribution(restaurantId: string | Types.ObjectId, dateFilter?: Date | null): Promise<any> {

        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        const distribution = await OrderModel.aggregate([
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
    }

    async getEvolutionData(restaurantId: string | Types.ObjectId, dateFilter: Date | null, format: string): Promise<any> {

        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        return await OrderModel.aggregate([
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
    }

    async getWaitersRanking(restaurantId: string | Types.ObjectId, dateFilter?: Date | null): Promise<any> {

        const matchStage: any = {
            restaurant: new Types.ObjectId(restaurantId.toString()),
            isPaid: true,
            waiterId: { $exists: true, $ne: null }
        };
        if (dateFilter) matchStage.createdAt = { $gte: dateFilter };

        return await OrderModel.aggregate([
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
    }

    async getByRestaurantId(restaurant: string | Types.ObjectId, filters: OrderFilters & { page?: number; limit?: number }): Promise<any> {

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

        const results = await (OrderModel as any).paginate(query, options);

        results.docs = results.docs.map((order: any) => ({
            ...order,
            kdsStatus: getKdsStatusFromItems(order.items)
        }));

        return results;
    }

    async getByIdWithPopulate(id: string | Types.ObjectId): Promise<OrderDB | null> {
        return this.dao.getByIdWithPopulate(id);
    }

    async getByUserId(userId: string | Types.ObjectId): Promise<OrderDB[]> {
        return this.dao.getByUserId(userId);
    }

    async updateStatusItems(orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: string, deletionReason?: string): Promise<OrderDB | null> {
        return this.dao.updateStatusItems(orderId, itemId, newStatus, deletionReason);
    }

    async addItemsToOrder(orderId: string | Types.ObjectId, items: any[], session?: any): Promise<OrderDB | null> {
        return this.dao.addItemsToOrder(orderId, items, session);
    }
}

export const orderRepository = new OrderRepository();
