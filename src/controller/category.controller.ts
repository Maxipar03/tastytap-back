import { categoryService } from "../service/category.service.js";
import { CategoryService } from "../types/category.types.js";
import { Request, Response, NextFunction } from "express";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../utils/custom-error.utils.js";
import { httpResponse } from "../utils/response.utils.js";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto.js";

class CategoryController {

    private service: CategoryService;

    constructor(services: CategoryService) {
        this.service = services;
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const body = req.body as CreateCategoryDto;
            if(!body.name) throw new BadRequestError("Datos de la categoria no encontrados");

            const categoryData: CreateCategoryDto = {
                ...body,
                restaurant: req.user?.restaurant!
            };

            const response = await this.service.create(categoryData);
            return httpResponse.Created(res, response);
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { id } = req.params;
            if (!id) throw new BadRequestError("ID de la categoria no encontrado");

            const body = req.body as UpdateCategoryDto;
            if (!body.name) throw new BadRequestError("Nombre de la categoria no encontrado");

            const response = await this.service.update(id, body);
            if (!response) throw new NotFoundError("Categoria no encontrada");

            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { id } = req.params;
            if (!id) throw new BadRequestError("Datos de la categoria no encontrados");

            const response = await this.service.delete(id);
            if (!response) throw new NotFoundError("Categoria no encontrada");

            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    getByAdmin = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const restaurantId = req.user?.restaurant;
            if (!restaurantId) throw new UnauthorizedError("No se encontro el restaurante");

            const response = await this.service.getByRestaurant(restaurantId);
            
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    getByClient = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { restaurantId }= req.params;
            if (!restaurantId) throw new UnauthorizedError("No se encontro el restaurante");
            
            const response = await this.service.getByRestaurant(restaurantId);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

}

export const categoryController = new CategoryController(categoryService);