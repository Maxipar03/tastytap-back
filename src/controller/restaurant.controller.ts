import { restaurnatService } from "../service/restaurant.service.js";
import RestaurantService from "../service/restaurant.service.js";
import { restaurantUsersService } from "../service/restaurant-users.service.js";
import { NextFunction, Request, Response } from "express";
import { httpResponse } from "../utils/http-response.js";
import { NotFoundError, UnauthorizedError, BadRequestError } from "../utils/custom-error.js";
import logger from "../utils/logger.js";
import { CreateRestaurantDto } from "../dto/restaurant.dto.js";

class RestaurantController {

    private service: RestaurantService;

    constructor(services: RestaurantService) {
        this.service = services;
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const id = req.user?.restaurant;
            if (!id) throw new NotFoundError("Datos de restaurante no encontrados")
            const response = await this.service.getById(id.toString());
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("Datos de restaurante no encontrados")
            
            logger.info({ restaurantId: id, userId: req.user?.id }, "Actualizando restaurante");
            
            const updateData = {
                ...req.body,
                ...(req.file && { file: req.file })
            };

            const response = await this.service.update(id, updateData);
            
            logger.info({ restaurantId: id, name: response?.name }, "Restaurante actualizado exitosamente");
            return httpResponse.Ok(res, response)
        } catch (error) {
            logger.error({ restaurantId: req.params.id, error: error }, "Error al actualizar restaurante");
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("Datos de restaurante no encontrados")
            
            logger.warn({ restaurantId: id, userId: req.user?.id }, "Eliminando restaurante");
            
            const response = await this.service.delete(id);
            
            logger.warn({ restaurantId: id }, "Restaurante eliminado exitosamente");
            return httpResponse.Ok(res, response)
        } catch (error) {
            logger.error({ restaurantId: req.params.id, error: error }, "Error al eliminar restaurante");
            next(error);
        }
    };

    createOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const restaurantId = req.user?.restaurant;
            if (!restaurantId) throw new UnauthorizedError("Restaurante no encontrado");
            
            const response = await this.service.createOnboarding(restaurantId.toString());
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    getRestaurantUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const restaurantId = req.user?.restaurant;
            if (!restaurantId) throw new BadRequestError("No tienes un restaurante asociado");
            console.log(restaurantId)
            
            const users = await restaurantUsersService.getRestaurantUsers(restaurantId.toString());
            return httpResponse.Ok(res, users);
        } catch (error) {
            next(error);
        }
    };

    getRestaurantInvitations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const restaurantId = req.user?.restaurant;
            if (!restaurantId) throw new BadRequestError("No tienes un restaurante asociado");
            
            const invitations = await restaurantUsersService.getRestaurantInvitations(restaurantId.toString());
            return httpResponse.Ok(res, invitations);
        } catch (error) {
            next(error);
        }
    };

}

export const restaurantController = new RestaurantController(restaurnatService)