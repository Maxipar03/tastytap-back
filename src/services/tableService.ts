import { tableMongoDao } from "../daos/mongodb/tableDao.js";
import { getIO } from "../config/socket.js";
import { TableDao, TableDB } from "../types/table.js";
import { Types } from "mongoose";
import cache from "../utils/cache.js";

class TableServices {

    private dao: TableDao;

    constructor(dao: TableDao) {
        this.dao = dao;
    }

    getByRestaurat = async (restaurant: string | Types.ObjectId): Promise<TableDB[]> => {
        const cacheKey = `tables:${restaurant}`;
        const cached = await cache.get<TableDB[]>(cacheKey);
        if (cached) return cached;

        const tables = await this.dao.getByRestaurant(restaurant);
        await cache.set(cacheKey, tables, 300); // 5 minutos
        return tables;
    };

    getById = async (tableId: string | Types.ObjectId): Promise<TableDB | null> => this.dao.getById(tableId);

    update = async (tableId: string | Types.ObjectId, updateData: any, restaurant: string | Types.ObjectId): Promise<TableDB | null> => {
        try {
            const result = await this.dao.update(tableId, updateData);
            
            if (result && restaurant) {
                await cache.del(`tables:${restaurant}`);
                const io = getIO();
                io.to(`restaurant-${restaurant}`).emit("mesa-actualizada", result);
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    }

}

export const tableServices = new TableServices(tableMongoDao);