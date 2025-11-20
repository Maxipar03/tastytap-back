import { restaurnatService } from "../services/restaurantService.js";
import RestaurantService from "../services/restaurantService.js";
import { NextFunction, Request, Response } from "express";
import { httpResponse } from "../utils/http-response.js";
import { NotFoundError } from "../utils/customError.js";
import logger from "../utils/logger.js";

class RestaurantController {

    private service: RestaurantService;

    constructor(services: RestaurantService) {
        this.service = services;
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const response = await this.service.getAll();
            return httpResponse.Ok(res,response)
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { name, address } = req.body;
            logger.info({ name, address, userId: req.user?.id }, "Creando nuevo restaurante");
            
            const response = await this.service.create(req.body);
            
            logger.info({ restaurantId: response._id, name: response?.restaurant.name }, "Restaurante creado exitosamente");
            return httpResponse.Created(res, response);
        } catch (error) {
            logger.error({ name: req.body.name, error: error }, "Error al crear restaurante");
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("Datos de restaurante no encontrados")
            const response = await this.service.getById(id);
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
            
            const response = await this.service.update(id, req.body);
            
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

}

export const restaurantController = new RestaurantController(restaurnatService)