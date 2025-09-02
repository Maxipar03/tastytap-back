import { seatService } from "../services/seatService.js";
import { Request, Response, NextFunction } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError, CustomError } from "../utils/customError.js";
import { SeatService } from "../types/seat.js";
import { v4 as uuidv4 } from "uuid";
import { Types } from "mongoose";
import { httpResponse } from "../utils/http-response.js";

class SeatController {

    private service: SeatService

    constructor(services: SeatService) {
        this.service = services;
    }

    getSeatByToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.cookies.seat_token;

            if (!token) {
                return httpResponse.NoContent(res)
            }

            const seat = await this.service.findOne({ sessionToken: token });

            if (!seat) {
                res.clearCookie("seat_token", {
                httpOnly: true,
                secure: true,    
                sameSite: 'none',
            });
                throw new NotFoundError("Error al utilizar el token");
            }

            return httpResponse.Ok(res, seat);
        } catch (error) {
            next(error)
        }
    };

    getByTableId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.mesaData) throw new NotFoundError("No se encontró la mesa");

            const tableId = req.mesaData.tableId;
            const onlyActive = req.query.active === 'true';

            const response = await this.service.getByTableId(tableId, onlyActive);
            return httpResponse.Ok(res, {tableId, response});
        } catch (error) {
            next(error);
        }
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const token = req.cookies.seat_token;

            if (token) throw new CustomError("Ya existe un asiento para esta mesa", 409);

            let guestName: string;
            let userId: Types.ObjectId | null | undefined;

            const tableId = req.mesaData?.tableId
            const restaurant = req.mesaData?.restaurant

            if (!restaurant) throw new BadRequestError("Restaurant ID is required");
            if (!tableId) throw new BadRequestError("Table ID is required");


            if (req.user) {
                userId = typeof req.user.id === 'string' ? new Types.ObjectId(req.user.id) : req.user.id
                guestName = req.user.name
            } else {
                if (!req.body.guestName) throw new BadRequestError("Guest name is required")
                guestName = req.body.guestName
                userId = null
            }

            const sessionToken = uuidv4();

            const response = await this.service.create({ tableId, guestName, userId, sessionToken, isActive: true }, restaurant);

            res.cookie("seat_token", sessionToken, {
                httpOnly: true,
                secure: true,    
                sameSite: 'none',
            });

            return httpResponse.Created(res, response)

        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { seatId } = req.params;
            const restaurant = req.mesaData?.restaurant

            if (!seatId || !restaurant) throw new BadRequestError("Faltan datos para la eliminacion")

            await this.service.delete(seatId, restaurant);

            res.clearCookie("seat_token", {
                httpOnly: true,
                secure: true,    
                sameSite: 'none',
            });

            return httpResponse.Ok(res, "Asiento eliminado correctamente")
        }
        catch (error) {
            console.error("Error al eliminar el asiento:", error);
            next(error);
        }
    }

    deleteAdmin = async (req: Request, res: Response, next: NextFunction) => {
        try {

            if (!req.user || !req.user.restaurant) throw new UnauthorizedError("No autorizado")

            const restaurant = req.user.restaurant
            const { seatId } = req.params;

            if (!seatId || !restaurant) throw new NotFoundError("Falta seatId / restaurant")

            await this.service.delete(seatId, restaurant);

            return httpResponse.Ok(res, "Asiento eliminado correctamente")
        } catch (error) {
            console.error("Error al eliminar el asiento:", error);
            next(error);
        }
    }

    getByTableIdAdmin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tableId } = req.params;
            if (!tableId) throw new NotFoundError("Falta tableId")

            const response = await this.service.getByTableIdWithOrders(tableId);

            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }
}

export const seatController = new SeatController(seatService)