import { CustomError, NotFoundError, UnauthorizedError } from "../utils/custom-error.js";
import { foodMongoDao } from "../dao/mongodb/food.dao.js";
import { RestaurantModel } from "../dao/mongodb/models/restaurant.model.js";
import { CreateFoodDto } from "../dto/food.dto.js";
import { Types } from "mongoose";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { MenuFiltersDto } from "../dto/menu-filters.dto.js";
import { FoodDB } from "../types/food.js";
import { PaginateResult } from "../types/express.js";
import { UserDB } from "../types/user.js";
import cache from "../utils/cache.js";

export default class FoodService {
    private dao: typeof foodMongoDao

    constructor(dao: typeof foodMongoDao) {
        this.dao = dao;
    }

    create = async (body: CreateFoodDto & { file?: Express.Multer.File }): Promise<FoodDB> => {
        try {
            let imageUrl: string | undefined;
            if (body.file) imageUrl = await uploadToCloudinary(body.file);

            const foodData = {
                ...body,
                ...(imageUrl && { image: imageUrl }),
            };

            const response = await this.dao.create(foodData as CreateFoodDto);
            if (!response) {
                if (imageUrl) await deleteFromCloudinary(imageUrl);
                throw new CustomError("Error al crear el plato", 500);
            }
            await RestaurantModel.findByIdAndUpdate(body.restaurant, { $push: { menu: response._id } });
            await cache.delPattern(`menu:${body.restaurant}:*`);
            return response;
        } catch (error) {
            throw error;
        };
    };

    update = async (id: string, userData: UserDB, body: Partial<FoodDB> & { file?: Express.Multer.File }): Promise<FoodDB | null> => {
        try {
            const currentFood = await this.getById(id)
            if (!currentFood) throw new NotFoundError("No se encontro el plato");
            if (userData.restaurant?.toString() !== currentFood.restaurant.toString()) throw new UnauthorizedError("No tienes permiso para modificar este dato");

            let newImageUrl: string | undefined;
            let updatedPayload: Partial<FoodDB> = { ...body };

            if (body.file) {
                newImageUrl = await uploadToCloudinary(body.file);
                updatedPayload = { ...body, image: newImageUrl }
            }

            const response = await this.dao.update(id, updatedPayload);
            if (!response) {
                if (newImageUrl) await deleteFromCloudinary(newImageUrl);
                throw new NotFoundError("No se encontro el plato");
            }
            await cache.del(`food:${id}`);
            await cache.delPattern(`menu:${currentFood.restaurant}:*`);
            return response;
        } catch (error) {
            throw error;
        }
    };

    delete = async (id: string, userData: UserDB): Promise<FoodDB | null> => {
        try {
            const food = await this.getById(id);
            if (!food) throw new NotFoundError("No se encontro el plato");
            if (userData.restaurant?.toString() !== food.restaurant.toString()) throw new UnauthorizedError("No tienes permiso para modificar este dato");

            if (food.image) await deleteFromCloudinary(food.image);

            const response = await this.dao.delete(id);
            if (food.restaurant) await RestaurantModel.findByIdAndUpdate(food.restaurant, { $pull: { menu: id } })

            await cache.del(`food:${id}`);
            await cache.delPattern(`menu:${food.restaurant}:*`);
            return response;
        } catch (error) {
            throw error;
        }
    };

    getByRestaurant = async (restaurant: string | Types.ObjectId, filter?: MenuFiltersDto): Promise<PaginateResult<FoodDB>> => {
        const cacheKey = `menu:${restaurant}:${JSON.stringify(filter || {})}`;
        const cached = await cache.get<PaginateResult<FoodDB>>(cacheKey);
        if (cached) return cached;

        const foods = await this.dao.getByRestaurant(restaurant, filter || {});
        await cache.set(cacheKey, foods, 300);
        return foods;
    };

    getById = async (id: string): Promise<FoodDB | null> => {
        const cacheKey = `food:${id}`;
        const cached = await cache.get<FoodDB>(cacheKey);
        if (cached) return cached;

        const food = await this.dao.getById(id);
        if (food) await cache.set(cacheKey, food, 300);
        return food;
    };

}

export const foodService = new FoodService(foodMongoDao);