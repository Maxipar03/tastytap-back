import { Types } from "mongoose";
import { TableSessionDB, TableSessionDao } from "../types/table-session.js";
import { tableSessionRepository } from "../repository/table-session.repository.js";
import cache from "../utils/cache.js";
import { CACHE_TTL, CACHE_KEYS } from "../constants/business.js";

export default class TableSessionService {
    private repository: typeof tableSessionRepository;

    constructor(repository: typeof tableSessionRepository) {
        this.repository = repository;
    }

    createSession = async (restaurant: string | Types.ObjectId, table: string | Types.ObjectId, session?: any): Promise<TableSessionDB> => {
        const result = await this.repository.createSession(restaurant, table, session);
        await cache.del(CACHE_KEYS.tableSession(table.toString()));
        await cache.del(CACHE_KEYS.activeSessions(restaurant.toString()));
        return result;
    };

    getActiveSession = async (tableId: string | Types.ObjectId, session?: any): Promise<TableSessionDB | null> => {
        const cacheKey = CACHE_KEYS.tableSession(tableId.toString());
        const cached = await cache.get<TableSessionDB>(cacheKey);
        if (cached) return cached;

        const activeSession = await this.repository.getActiveByTableId(tableId, session);
        if (activeSession) await cache.set(cacheKey, activeSession, CACHE_TTL.TABLE_SESSION);
        return activeSession;
    };

    getActiveSessionsByRestaurant = async (restaurant: string | Types.ObjectId): Promise<TableSessionDB[]> => {
        const cacheKey = CACHE_KEYS.activeSessions(restaurant.toString());
        const cached = await cache.get<TableSessionDB[]>(cacheKey);
        if (cached) return cached;

        const sessions = await this.repository.getActiveSessionsByRestaurant(restaurant);
        await cache.set(cacheKey, sessions, CACHE_TTL.ACTIVE_SESSIONS);
        return sessions;
    };

    closeSession = async (sessionId: string | Types.ObjectId): Promise<TableSessionDB | null> => {
        const session = await this.repository.closeSession(sessionId);
        if (session) {
            await cache.del(CACHE_KEYS.tableSession(session.table.toString()));
            await cache.del(CACHE_KEYS.activeSessions(session.restaurant.toString()));
        }
        return session;
    };
    
    addOrderToSession = async (sessionId: string | Types.ObjectId, orderId: string | Types.ObjectId, session?: any): Promise<TableSessionDB | null> => {
        const result = await this.repository.addOrderToSession(sessionId, orderId, session);
        if (result) {
            await cache.del(CACHE_KEYS.tableSession(result.table.toString()));
            await cache.del(CACHE_KEYS.activeSessions(result.restaurant.toString()));
        }
        return result;
    };

}

export const tableSessionService = new TableSessionService(tableSessionRepository);