import { tableMongoDao } from "../daos/mongodb/tableDao.js";
import { orderMongoDao } from "../daos/mongodb/orderDao.js";
import { getIO } from "../config/socket.js";

import { OrderDao } from "../types/order.js";
import { OrderDB } from "../types/order.js";
import { TableDao, TableDB } from "../types/table.js";
import { Types } from "mongoose";

interface TableWithOrders extends TableDB {
    orders: OrderDB[];
}

class TableServices {

    private dao: TableDao;
    private orderDao: OrderDao;

    constructor(dao: TableDao, orderDao: OrderDao) {
        this.dao = dao;
        this.orderDao = orderDao;
    }

    getTablesWithOrders = async (restaurant: string | Types.ObjectId): Promise<TableWithOrders[]> => {
        try {
            const tables = await tableMongoDao.getByRestaurant(restaurant)

            const result = await Promise.all(
                tables.map(async (table) => {
                    const orders = await this.orderDao.getByTableId(table._id.toString());
                    return {
                        ...table,
                        orders,
                    } as TableWithOrders
                })
            )

            return result
        } catch (error) {
            throw error;
        }
    }

    getByRestaurat = async (restaurant: string | Types.ObjectId): Promise<TableDB[]> => {
        try {
            return await this.dao.getByRestaurant(restaurant);
        } catch (error) {
            throw error;
        }
    }

    update = async (tableId: string | Types.ObjectId, updateData: any, restaurant: string | Types.ObjectId): Promise<TableDB | null> => {
        try {
            const result = await this.dao.update(tableId, updateData);
            
            if (result && restaurant) {
                const io = getIO();
                io.to(`restaurant-${restaurant}`).emit("mesa-actualizada", result);
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    }

}

export const tableServices = new TableServices(tableMongoDao, orderMongoDao);