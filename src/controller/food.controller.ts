import { foodService } from "../service/food.service.js";
import { FoodService } from "../types/food.js";
import { Request, Response, NextFunction } from "express";
import { MenuFiltersDto, MenuFiltersMapper } from "../dto/menu-filters.dto.js";
import { httpResponse } from "../utils/http-response.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/custom-error.js";
import { CreateFoodDto, UpdateFoodDto } from "../dto/food.dto.js";
import { FoodOption } from "../types/food.js";

interface FoodRequestBody {
    name: string;
    description: string;
    price: string;
    category: string;
    stock: string;
    ingredients: string;
    options: string;
    isVegetarian: string;
    isVegan: string;
    isGlutenFree: string;
}

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

            const body = req.body as FoodRequestBody;
            const parsedIngredients = JSON.parse(body.ingredients) as string[];
            const parsedOptions = JSON.parse(body.options) as FoodOption[];

            const foodData: CreateFoodDto & { file?: Express.Multer.File } = {
                name: body.name,
                description: body.description,
                price: Number(body.price),
                category: body.category as any,
                stock: Number(body.stock),
                ingredients: parsedIngredients,
                options: parsedOptions,
                isVegetarian: body.isVegetarian === 'true',
                isVegan: body.isVegan === 'true',
                isGlutenFree: body.isGlutenFree === 'true',
                restaurant: req.user.restaurant,
                image: '',
                ...(req.file && { file: req.file })
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

            const body = req.body as FoodRequestBody;
            const parsedIngredients = JSON.parse(body.ingredients) as string[];
            const parsedOptions = JSON.parse(body.options) as FoodOption[];

            const updateData: UpdateFoodDto & { file?: Express.Multer.File } = {
                name: body.name,
                description: body.description,
                price: Number(body.price),
                category: body.category as any,
                stock: Number(body.stock),
                ingredients: parsedIngredients,
                options: parsedOptions,
                isVegetarian: body.isVegetarian === 'true',
                isVegan: body.isVegan === 'true',
                isGlutenFree: body.isGlutenFree === 'true',
                ...(req.file && { file: req.file })
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