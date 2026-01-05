import { Types } from "mongoose";
import { TableSessionDB, TableSessionDao } from "../../types/table-session.js";
import { TableSessionModel } from "./models/table-session.model.js";
import { OrderModel } from "./models/order.model.js";

export class TableSessionDaoMongoDB implements TableSessionDao {

    async getByTableId(tableId: string | Types.ObjectId): Promise<TableSessionDB | null> {
        return await TableSessionModel.findOne({ table: tableId }).populate('orders').lean();
    }

    async getActiveByTableId(tableId: string | Types.ObjectId, session?: any): Promise<TableSessionDB | null> {
        const query = TableSessionModel.findOne({
            table: tableId,
            status: 'active'
        }).populate({
            path: 'orders',
            options: { session: session }
        });

        if (session) {
            query.session(session);
        }

        return await query.lean();
    }

    async getActiveSessionsByRestaurant(restaurant: string | Types.ObjectId): Promise<TableSessionDB[]> {
        return await TableSessionModel.find({
            restaurant,
            status: 'active'
        }).lean();
    }

    async createSession(restaurant: string | Types.ObjectId, table: string | Types.ObjectId, session?: any): Promise<TableSessionDB> {
        const newSession = new TableSessionModel({
            restaurant,
            table,
            status: 'active',
            orders: [],
            totalAmount: 0
        });
        return await newSession.save({ session });
    }

    async closeSession(id: string | Types.ObjectId): Promise<TableSessionDB | null> {
        return await TableSessionModel.findByIdAndUpdate(
            id,
            { status: 'closed' },
            { new: true }
        );
    }

    async addOrderToSession(sessionId: string | Types.ObjectId, orderId: string | Types.ObjectId, session?: any): Promise<TableSessionDB | null> {

        console.log("=== addOrderToSession DAO ===");
        console.log("OrderId:", orderId);
        console.log("SessionId:", sessionId);
        console.log("Session:", session);

        const orderQuery = OrderModel.findById(orderId);
        if (session) orderQuery.session(session);

        const order = await orderQuery;
        console.log("Order found:", !!order);
        console.log("Order pricing:", order?.pricing);

        if (!order) return null;

        const updateOptions: any = { new: true };
        if (session) updateOptions.session = session;

        const result = await TableSessionModel.findByIdAndUpdate(
            sessionId,
            {
                $push: { orders: orderId },
                $inc: { totalAmount: order.pricing.total }
            },
            updateOptions
        );

        console.log("Update result:", result);
        return result;
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