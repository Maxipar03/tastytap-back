import { Request, Response, NextFunction } from "express";
import { httpResponse } from "../utils/http-response.js";
import { BadRequestError } from "../utils/custom-error.js";
import { restaurantRequestServices } from "../service/restaurant-request.service.js";
import { RestaurantRequestServices } from "../types/restaurant-request.js";

class RestaurantRequestController {

    private service: RestaurantRequestServices;

    constructor(service: RestaurantRequestServices) {
        this.service = service;
    }

    createRestaurantRequest = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            if (!req.user) throw new BadRequestError("No se pudo obtener el usuario")
            const { isValidateMail, id } = req.user

            if (!isValidateMail) throw new BadRequestError("Debes validar tu email antes")

            const result = await this.service.createRestaurantRequest(id, req.body);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };

    approveRequest = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { id } = req.params;
            if (!id) throw new BadRequestError("Error en el envio de datos");
            const result = await this.service.approveRequest(id);

            httpResponse.Ok(res, { message: "Solicitud aprobada", data: result });
        } catch (error) { next(error); }
    };

    rejectRequest = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { id } = req.params;
            if (!id) throw new BadRequestError("Error en el envio de datos")
            const result = await this.service.rejectRequest(id);
    
            httpResponse.Ok(res, { message: "Solicitud rechazada", data: result });
        } catch (error) { next(error); }
    };
}

export const restaurantRequestController = new RestaurantRequestController(restaurantRequestServices);
