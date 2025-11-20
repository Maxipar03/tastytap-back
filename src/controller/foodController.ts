import { foodService } from "../services/foodService.js";
import { FoodService } from "../types/food.js";
import { Request, Response, NextFunction } from "express";
import { MenuFiltersDto, MenuFiltersMapper } from "../DTO/menuFiltersDto.js";
import { httpResponse } from "../utils/http-response.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/customError.js";

class FoodController {

    private service: FoodService;

    constructor(services: FoodService) {
        this.service = services;
    }

    getAllMenu = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {

            const restaurant = req.tableData?.restaurant.id || req.toGoData?.restaurant.id;
            if (!restaurant) throw new BadRequestError("No se encontro el id del restaurante");

            const filters: MenuFiltersDto = MenuFiltersMapper.mapFromQuery(req.query);

            const response = await this.service.getByRestaurant(restaurant, filters);
            return httpResponse.Ok(res, response);

        } catch (error) {
            next(error);
        }
    };

    getAllAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {

            const restaurant = req.user?.restaurant;
            if (!restaurant) throw new BadRequestError("No se encontro el id del restaurante");

            const response = await this.service.getByRestaurant(restaurant, {});
            return httpResponse.Ok(res, response);

        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {

            if (!req.user || !req.user.restaurant) throw new UnauthorizedError("Datos de usuario o restaurante no encontrados");
            if (!req.body || !req.body.ingredients || !req.body.options) throw new NotFoundError("Datos de comida no encontrados");

            const parsedIngredients = JSON.parse(req.body.ingredients);
            const parsedOptions = JSON.parse(req.body.options);

            const foodData = {
                ...req.body,
                restaurant: req.user.restaurant,
                ingredients: parsedIngredients,
                options: parsedOptions,
                file: req.file
            };

            const response = await this.service.create(foodData);
            return httpResponse.Ok(res, response);

        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("Datos de comida no encontrados");

            const response = await this.service.getById(id);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        };
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("Datos de comida no encontrados");
            if (!req.user || !req.user.restaurant) throw new UnauthorizedError("Datos de usuario o restaurante no encontrados");

            const parsedIngredients = JSON.parse(req.body.ingredients);
            const parsedOptions = JSON.parse(req.body.options);

            const updateData = {
                ...req.body,
                ingredients: parsedIngredients,
                options: parsedOptions,
                file: req.file
            };

            const response = await this.service.update(id, req.user, updateData);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("Datos de comida no encontrados");
            const userData = req.user;
            const response = await this.service.delete(id, userData);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

}

export const foodController = new FoodController(foodService);