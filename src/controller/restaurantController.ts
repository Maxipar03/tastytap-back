import { restaurnatService } from "../services/restaurantService.js";
import { TableModel } from "../daos/mongodb/models/tableModel.js";
import RestaurantService from "../services/restaurantService.js";
import { NextFunction, Request, Response } from "express";
import { httpResponse } from "../utils/http-response.js";
import { NotFoundError } from "../utils/customError.js";

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

            const { numberTables, ...restaurantData } = req.body

            const response = await this.service.create({
                ...restaurantData,
                numberTables
            });

            // Crea la cantidad de mesas necesarias

            const tables = [];

            for (let i = 1; i <= numberTables; i++) {
                tables.push({
                    restaurant: response._id,
                    tableNumber: i,
                });
            }

            await TableModel.insertMany(tables);

            return httpResponse.Created(res,response)
        } catch (error) {
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
            const response = await this.service.update(id, req.body);
            return httpResponse.Ok(res, response)
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("Datos de restaurante no encontrados")
            const response = await this.service.delete(id);
            return httpResponse.Ok(res, response)
        } catch (error) {
            next(error);
        }
    };

}

export const restaurantController = new RestaurantController(restaurnatService)