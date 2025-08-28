import { CustomError, BadRequestError, NotFoundError } from "../utils/customError.js";
import { seatMogoDao } from "../daos/mongodb/seatDao.js";;
import { OrderModel } from "../daos/mongodb/models/orderModel.js";
import { SeatDao, SeatDB } from "../types/seat.js";
import { getIO } from "../config/socket.js";
import { OrderDB } from "../types/order.js";
import { CreateSeatDto } from "../DTO/createSeatDto.js";
import { Types } from "mongoose";

export interface SeatWithOrders extends SeatDB {
    orders: OrderDB[];
}

export default class SeatService {

    private dao: SeatDao;

    constructor(dao: SeatDao) {
        this.dao = dao;
    }

    getByTableId = async (tableId: string | Types.ObjectId, onlyActive: boolean = false): Promise<SeatDB[]> => {
        try {
            return await this.dao.getByTableId(tableId, onlyActive);
        } catch (error) {
            throw error;
        }
    }

    getByTableIdWithOrders = async (tableId: string | Types.ObjectId): Promise<SeatWithOrders[]> => {

        const seats = await this.getByTableId(tableId, true);

        console.log(seats, "seats en seatService")

        if (!seats || seats.length === 0) return [];

        const seatIds = seats.map(seat => seat._id);

        const orders = await OrderModel.find({ seatId: { $in: seatIds } }).lean() as OrderDB[];

        // Agrupar órdenes por asiento
        const ordersBySeat: { [key: string]: OrderDB[] } = {};
        orders.forEach(order => {
            const seatId = order.seatId.toString();
            if (!ordersBySeat[seatId]) ordersBySeat[seatId] = [];
            ordersBySeat[seatId].push(order);
        });

        const result = seats.map(seat => {
            const plainSeat = seat.toObject ? seat.toObject() : seat;
            return {
                ...plainSeat,
                orders: ordersBySeat[plainSeat._id.toString()] || []
            };
        });

        return result;
    }

    getById = async (id: string | Types.ObjectId): Promise<SeatDB | null> => {
        try {
            return await this.dao.getByObjectId(id);
        } catch (error) {
            throw error;
        }
    }

    findOne = async (filter: any): Promise<SeatDB | null> => {
        try {
            return await this.dao.findOne(filter);
        } catch (error) {
            throw error;
        }
    }

    create = async (body:CreateSeatDto, restaurant:Types.ObjectId | string): Promise<SeatDB>=> {
        try {
            const { tableId, guestName, userId } = body;

            if (!tableId) throw new NotFoundError("tableId es requerido");

            const existingName = await this.findOne({ tableId, guestName });
            if (existingName) throw new BadRequestError("El nombre ya está en uso en esta mesa");
        
            if (userId) {
                const existingUser = await this.findOne({ tableId, userId });
                if (existingUser) throw new BadRequestError("El usuario ya tiene un asiento en esta mesa");
            }

            const response = await this.dao.create(body);
            if (!response) throw new CustomError("Error al crear el asiento", 500);

            const populatedSeat = await response.populate("tableId", "tableNumber");

            const io = getIO();

            io.to([`table-${tableId}`, `restaurant-${restaurant}`]).emit("join-table", {
                seat: {
                    ...populatedSeat.toObject(),
                    tableNumber: (populatedSeat.tableId as unknown as { tableNumber: number }).tableNumber 
                }
            });

            return response;
        } catch (error) {
            console.error("Error en seatService:", error);
            throw error;
        };
    };

    delete = async (seatId: Types.ObjectId | string, restaurant: Types.ObjectId | string): Promise<SeatDB | null> => {
        try {

            const seat = await this.getById(seatId);
            if (!seat) throw new NotFoundError("Asiento no encontrado");

            const existingOrders = await OrderModel.find({ seatId });
            if (existingOrders.length > 0) throw new BadRequestError("No se puede eliminar el asiento porque tiene órdenes asociadas");

            const response = await this.dao.delete(seatId.toString());
            const tableId = seat.tableId;

            const io = getIO();

            io.to([`table-${tableId}`, `restaurant-${restaurant}`]).emit("leave-table", {
                seat: response,
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

}

export const seatService = new SeatService(seatMogoDao);
