import { tableServices } from "../services/tableService.js";
import { getIO } from "../config/socket.js";
import { TableService } from "../types/table.js";
import { Request, Response, NextFunction } from "express";
import { NotFoundError, UnauthorizedError } from "../utils/customError.js";
import { httpResponse } from "../utils/http-response.js";

class TableController {

    private service: TableService

    constructor(services: TableService) {
        this.service = services;
    }

    getTablesWithSeatsAndOrders = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const restaurant = req.user?.restaurant
            const waiterId = req.user?.id;

            if(!restaurant) throw new NotFoundError("No se encontro el restaurante")
            if(!waiterId) throw new NotFoundError("No se encontro el mesero")

            const data = await this.service.getTablesWithSeatsAndOrders(restaurant,);
            return httpResponse.Ok(res,{restaurant, waiterId, data});
        } catch (err) {
            console.error(err)
            res.status(500).json({ error: "Error al obtener las mesas" })
        }
    }

    getByRestaurat = async (req: Request, res: Response, next: NextFunction) => {
        try {

            if(!req.user) throw new UnauthorizedError('No se encontro el usuario')

            if (!req.user.restaurant) throw new UnauthorizedError("No se encontro el ID del restaurante")

            const restaurant = req.user.restaurant;
            const waiterId = req.user.id;
            const response = await this.service.getByRestaurat(restaurant);
            return httpResponse.Ok(res, {restaurant, response, waiterId});
            
        } catch (error) {
            next(error);
        }
    }

    updateTable = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const restaurant = req.user?.restaurant
            if(!restaurant) throw new Error("No se encontro el restaurante")
            const { tableId } = req.params;
            if(!tableId) throw new Error("No se encontro la mesa")
            const io = getIO();
            const updatedTable = await this.service.update(tableId, {
                state: "available",
                waiterServing: null,
            });
            io.to(`restaurant-${restaurant}`).emit("mesa-actualizada", updatedTable);
            return res.status(200).json({ message: "Mesa actualizada", data: updatedTable });
        } catch (error) {
            console.error('Error al actualizar mesa:', error);
        }
    }

}

export const tableController = new TableController(tableServices);