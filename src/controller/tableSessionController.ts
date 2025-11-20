import TableSessionService, { tableSessionService } from "../services/tableSessionService.js";
import { Request, Response, NextFunction } from "express";
import { httpResponse } from "../utils/http-response.js";
import { UnauthorizedError } from "../utils/customError.js";

class TableSessionController {

    private service: TableSessionService;

    constructor(services: TableSessionService) {
        this.service = services;
    }

    getActiveSessionsByRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const restaurant = req.user?.restaurant;
            if (!restaurant) throw new UnauthorizedError("No se encontró el restaurante del usuario");
                        
            const response = await this.service.getActiveSessionsByRestaurant(restaurant);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

}

export const tableSessionController = new TableSessionController(tableSessionService);