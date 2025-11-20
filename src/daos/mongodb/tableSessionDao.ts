import { Types } from "mongoose";
import { TableSessionDB, TableSessionDao } from "../../types/tableSession.js";
import { TableSessionModel } from "./models/tableSessionModel.js";
import { OrderModel } from "./models/orderModel.js";

export class TableSessionDaoMongoDB implements TableSessionDao {

    async getByTableId(tableId: string | Types.ObjectId): Promise<TableSessionDB | null> {
        return await TableSessionModel.findOne({ table: tableId }).populate('orders').lean();
    }

    async getActiveByTableId(tableId: string | Types.ObjectId): Promise<TableSessionDB | null> {
        return await TableSessionModel.findOne({ 
            table: tableId, 
            status: 'active' 
        }).populate('orders').lean();
    }

    async getActiveSessionsByRestaurant(restaurant: string | Types.ObjectId): Promise<TableSessionDB[]> {
        return await TableSessionModel.find({ 
            restaurant, 
            status: 'active' 
        }).populate({
            path: 'table',
            select: 'tableNumber status waiterServing',
            populate: {
                path: 'waiterServing',
                select: 'name'
            }
        }).populate('orders', 'pricing status items').lean();
    }

    async createSession(restaurant: string | Types.ObjectId, table: string | Types.ObjectId): Promise<TableSessionDB> {
        const newSession = new TableSessionModel({
            restaurant,
            table,
            status: 'active',
            orders: [],
            totalAmount: 0
        });
        return await newSession.save();
    }

    async closeSession(id: string | Types.ObjectId): Promise<TableSessionDB | null> {
        return await TableSessionModel.findByIdAndUpdate(
            id, 
            { status: 'closed' }, 
            { new: true }
        );
    }

    async addOrderToSession(sessionId: string | Types.ObjectId, orderId: string | Types.ObjectId): Promise<TableSessionDB | null> {
        const order = await OrderModel.findById(orderId);
        if (!order) return null;

        return await TableSessionModel.findByIdAndUpdate(
            sessionId,
            { 
                $push: { orders: orderId },
                $inc: { totalAmount: order.pricing.total }
            },
            { new: true }
        );
    }

    async updateTotalAmount(sessionId: string | Types.ObjectId): Promise<TableSessionDB | null> {
        const session = await TableSessionModel.findById(sessionId).populate('orders');
        if (!session) return null;

        const total = (session.orders as any[]).reduce((sum, order) => sum + order.pricing.total, 0);
        
        return await TableSessionModel.findByIdAndUpdate(
            sessionId,
            { totalAmount: total },
            { new: true }
        );
    }
}

export const tableSessionMongoDao = new TableSessionDaoMongoDB();