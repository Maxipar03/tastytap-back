import { Types } from "mongoose";
import { TableSessionDB } from "../types/table-session.js";
import { tableSessionMongoDao } from "../dao/mongodb/table-session.dao.js";
import { TableSessionModel } from "../dao/mongodb/models/table-session.model.js";

class TableSessionRepository {
    constructor(private dao: typeof tableSessionMongoDao) {}

    async getByTableId(tableId: string | Types.ObjectId): Promise<TableSessionDB | null> {
        return this.dao.getByTableId(tableId);
    }

    async getActiveByTableId(tableId: string | Types.ObjectId, session?: any): Promise<TableSessionDB | null> {
        return this.dao.getActiveByTableId(tableId, session);
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
        }).populate('orders').lean();
    }

    async createSession(restaurant: string | Types.ObjectId, table: string | Types.ObjectId, session?: any): Promise<TableSessionDB> {
        return this.dao.createSession(restaurant, table, session);
    }

    async closeSession(id: string | Types.ObjectId): Promise<TableSessionDB | null> {
        return this.dao.closeSession(id);
    }

    async addOrderToSession(sessionId: string | Types.ObjectId, orderId: string | Types.ObjectId, session?: any): Promise<TableSessionDB | null> {
        return this.dao.addOrderToSession(sessionId, orderId, session);
    }

    async updateTotalAmount(sessionId: string | Types.ObjectId): Promise<TableSessionDB | null> {
        return this.dao.updateTotalAmount(sessionId);
    }
}

export const tableSessionRepository = new TableSessionRepository(tableSessionMongoDao);
