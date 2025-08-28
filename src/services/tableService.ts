import { tableMongoDao } from "../daos/mongodb/tableDao.js";
import { orderMongoDao } from "../daos/mongodb/orderDao.js";
import { seatMogoDao } from "../daos/mongodb/seatDao.js";
import { SeatDao } from "../types/seat.js";
import { OrderDao } from "../types/order.js";
import { OrderDB } from "../types/order.js";
import { TableDao, TableDB } from "../types/table.js";
import { Types } from "mongoose";

interface SeatWithOrders {
    seatId: Types.ObjectId;
    guestName?: string | null | undefined;
    clientId?: Types.ObjectId | null | undefined;
    createdAt: Date;
    orders: OrderDB[];
}

interface TableWithSeatsAndOrders extends TableDB {
    seats: SeatWithOrders[];
}

class TableServices {

    private dao: TableDao;
    private seatDao: SeatDao;
    private orderDao: OrderDao;

    constructor(dao: TableDao, orderDao: OrderDao, seatDao: SeatDao) {
        this.dao = dao;
        this.orderDao = orderDao;
        this.seatDao = seatDao;
    }

    getTablesWithSeatsAndOrders = async (restaurant: string | Types.ObjectId): Promise<TableWithSeatsAndOrders[]> => {
        try {

            const tables = await tableMongoDao.getByRestaurant(restaurant) // Obtiene las mesas del restaurant

            const result = await Promise.all(
                tables.map(async (table) => {
                    const seats = await seatMogoDao.getByTableId(table._id.toString(), true) // Obtiene las sillas activas asociadas a la mesas

                    const seatsWithOrders: SeatWithOrders[] = await Promise.all(
                        seats.map(async (seat) => {
                            const orders = await this.orderDao.getBySeatId(seat._id.toString());

                            return {
                                seatId: seat._id,
                                guestName: seat.guestName,
                                clientId: seat.userId,
                                createdAt: seat.createdAt,
                                orders: orders,
                            };
                        })
                    );

                    return {
                        ...table,
                        seats: seatsWithOrders,
                    } as TableWithSeatsAndOrders
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

    update = async (tableId: string | Types.ObjectId, updateData: any): Promise<TableDB | null> => {
        try {
            console.log(tableId)
            const result = await this.dao.update(tableId, updateData);
            return result;
        } catch (error) {
            throw error;
        }
    }

}

export const tableServices = new TableServices(tableMongoDao, orderMongoDao, seatMogoDao);