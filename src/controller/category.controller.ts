import { categoryService } from "../service/category.service.js";
import { Request, Response, NextFunction } from "express";
import { BadRequestError, UnauthorizedError } from "../utils/custom-error.js";
import { httpResponse } from "../utils/http-response.js";
import CategoryService from "../service/category.service.js";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto.js";

class CategoryController {

    private service: CategoryService;

    constructor(services: CategoryService) {
        this.service = services;
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const body = req.body as CreateCategoryDto;
            const categoryData: CreateCategoryDto = {
                ...body,
                restaurant: req.user?.restaurant!
            };

            const response = await this.service.create(categoryData);
            return httpResponse.Created(res, response);
        } catch (error) {
            next(error);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            const body = req.body as UpdateCategoryDto;
            if (!id) throw new BadRequestError("ID de la categoria no encontrado");

            const response = await this.service.update(id, body);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { id } = req.params;
            if (!id) throw new BadRequestError("Datos de la categoria no encontrados");

            const response = await this.service.delete(id);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    categoryByRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            if (!req.user?.restaurant) throw new UnauthorizedError("No se encontro el restaurante")
            const id = req.user?.restaurant;

            const response = await this.service.getByRestaurant(id);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    getByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.tableData?.restaurant.id && !req.toGoData?.restaurant.id) throw new UnauthorizedError("No se encontro el restaurante");
            const id = req.tableData?.restaurant.id! || req.toGoData?.restaurant.id!;
            const response = await this.service.getByRestaurant(id);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

}

export const categoryController = new CategoryController(categoryService)