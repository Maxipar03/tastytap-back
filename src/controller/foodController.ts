import { foodService } from "../services/foodService.js";
import { FoodService } from "../types/food.js";
import cloudinary from "../config/cloudinary.js";
import { Request, Response, NextFunction } from "express";
import { MenuFiltersDto } from "../DTO/menuFiltersDto.js";
import { httpResponse } from "../utils/http-response.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/customError.js";

class FoodController {

    private service: FoodService;

    constructor(services: FoodService) {
        this.service = services;
    }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const restaurant = req.mesaData?.restaurant;
            if (!restaurant) throw new BadRequestError("No se encontro el id del restaurante")

            const { category, minPrice, maxPrice, search, available, isVegetarian, isVegan, isGlutenFree } = req.query;

            const filters: MenuFiltersDto = {};

            if (category) filters.category = category as string;
            if (minPrice) filters.minPrice = parseFloat(minPrice as string);
            if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
            if (search) filters.search = search as string;
            if (available !== undefined) filters.available = available === 'true';
            if (isVegetarian !== undefined) filters.isVegetarian = isVegetarian === 'true';
            if (isVegan !== undefined) filters.isVegan = isVegan === 'true';
            if (isGlutenFree !== undefined) filters.isGlutenFree = isGlutenFree === 'true';

            const response = await this.service.getByRestaurantId(restaurant, filters);

            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    getAllAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const restaurant = req.user?.restaurant;
            if (!restaurant) throw new BadRequestError("No se encontro el id del restaurante");
            const response = await this.service.getByRestaurantId(restaurant, {});
            console.log(response)
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {

            if (!req.user || !req.user.restaurant) throw new UnauthorizedError("Datos de usuario o restaurante no encontrados");
            if (!req.body || !req.body.ingredients || !req.body.options) throw new NotFoundError("Datos de comida no encontrados")

            let imageUrl = "";

            if (req.file) {
                console.log('Cloudinary config:', {
                    cloud_name: cloudinary.config().cloud_name,
                    api_key: cloudinary.config().api_key
                });

                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
                    api_key: process.env.CLOUDINARY_API_KEY!,
                    api_secret: process.env.CLOUDINARY_API_SECRET!
                });

                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "foods",
                    transformation: [{ width: 500, height: 500, crop: "limit" }]
                });
                imageUrl = result.secure_url;
            }

            const foodData = {
                ...req.body,
                restaurant: req.user.restaurant,
                ingredients: req.body.ingredients,
                options: typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options,
                image: imageUrl
            };

            const response = await this.service.create(foodData);

            return httpResponse.Ok(res, response);
        } catch (error) {
            console.log(error)
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

            let imageUrl = "";

            if (req.file) {
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
                    api_key: process.env.CLOUDINARY_API_KEY!,
                    api_secret: process.env.CLOUDINARY_API_SECRET!
                });

                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "foods",
                    transformation: [{ width: 500, height: 500, crop: "limit" }]
                });
                imageUrl = result.secure_url;
            }

            const updateData = {
                ...req.body,
                ...(req.body.options && {
                    options: typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options
                }),
                ...(imageUrl && { image: imageUrl })
            };

            console.log("id", id)
            console.log("req.user", req.user)
            console.log("id", updateData)

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

export const foodController = new FoodController(foodService)