import TableSessionService, { tableSessionService } from "../service/table-session.service.js";
import { Request, Response, NextFunction } from "express";
import { httpResponse } from "../utils/http-response.js";
import { UnauthorizedError, BadRequestError } from "../utils/custom-error.js";
import { tableServices } from "../service/table.service.js";

class TableSessionController {

    private service: TableSessionService;

    constructor(services: TableSessionService) {
        this.service = services;
    }

    getActiveSessionsByRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const restaurant = req.user?.restaurant;
            if (!restaurant) throw new UnauthorizedError("No se encontró el restaurante del usuario");
                        
            const response = await this.service.getActiveSessionsByRestaurant(restaurant);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    createSession = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { tableId } = req.body;
            const restaurant = req.user?.restaurant;
            const waiterId = req.user?.id
            
            if (!restaurant || !tableId || !waiterId) throw new UnauthorizedError("Faltan datos para la creacion de la session de mesa");

            const table = await tableServices.getById(tableId);
            if (!table) throw new BadRequestError("Mesa no encontrada");
            if (table.state !== "available") throw new BadRequestError("La mesa no está disponible");

            const activeSession = await this.service.getActiveSession(tableId);
            if (activeSession) throw new BadRequestError("La mesa ya tiene una sesión activa");

            const session = await this.service.createSession(restaurant, tableId);
            await tableServices.update(tableId, { state: "occupied", activeSession: session._id, waiterServing: waiterId }, restaurant);

            return httpResponse.Ok(res, session);
        } catch (error) {
            next(error);
        }
    };

}

export const tableSessionController = new TableSessionController(tableSessionService);

