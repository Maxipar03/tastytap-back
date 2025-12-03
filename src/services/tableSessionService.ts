import { Types } from "mongoose";
import { TableSessionDB, TableSessionDao } from "../types/tableSession.js";
import { tableSessionMongoDao } from "../daos/mongodb/tableSessionDao.js";

export default class TableSessionService {
    private dao: TableSessionDao;

    constructor(dao: TableSessionDao) {
        this.dao = dao;
    }

    createSession = async (restaurant: string | Types.ObjectId, table: string | Types.ObjectId, session?: any): Promise<TableSessionDB> => this.dao.createSession(restaurant, table, session);

    getActiveSession = async (tableId: string | Types.ObjectId ,session?: any): Promise<TableSessionDB | null> => this.dao.getActiveByTableId(tableId, session);

    getActiveSessionsByRestaurant = async (restaurant: string | Types.ObjectId): Promise<TableSessionDB[]> => this.dao.getActiveSessionsByRestaurant(restaurant);

    closeSession = async (sessionId: string | Types.ObjectId): Promise<TableSessionDB | null> => this.dao.closeSession(sessionId);
    
    addOrderToSession = async (sessionId: string | Types.ObjectId, orderId: string | Types.ObjectId, session?: any): Promise<TableSessionDB | null> => this.dao.addOrderToSession(sessionId, orderId, session);

}

export const tableSessionService = new TableSessionService(tableSessionMongoDao);