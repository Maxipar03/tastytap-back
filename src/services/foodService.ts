import { CustomError, NotFoundError, UnauthorizedError } from "../utils/customError.js";
import { foodMongoDao } from "../daos/mongodb/foodDao.js";
import { RestaurantModel } from "../daos/mongodb/models/restaurantModel.js";
import { CreateFoodDto } from "../DTO/foodDto.js";
import { Types } from "mongoose";
import { MenuFiltersDto } from "../DTO/menuFiltersDto.js";
import { FoodDao, FoodDB } from "../types/food.js";
import { UserDB } from "../types/user.js";

export default class FoodService {
    private dao: FoodDao

    constructor(dao: FoodDao) {
        this.dao = dao;
    }

    create = async (body: CreateFoodDto): Promise<FoodDB> => {
        try {
            const response = await this.dao.create(body);
            if (!response) throw new CustomError("Error al crear el plato", 500);
            await RestaurantModel.findByIdAndUpdate(body.restaurant, { $push: { menu: response._id } });
            return response;
        } catch (error) {
            throw error;
        };
    };

    getAll = async (): Promise<FoodDB[]> => {
        try {
            return await this.dao.getAll();
        } catch (error) {
            throw error;
        }
    };

    getByRestaurantId = async (restaurant: string | Types.ObjectId, filter?: MenuFiltersDto): Promise<FoodDB[]> => {
        try {
            return await this.dao.getByRestaurantId(restaurant, filter || {});
        } catch (error) {
            throw error;
        }
    }

    getById = async (id: string) => {
        try {
            const response = await this.dao.getById(id);
            if (!response) throw new CustomError("No se encontro el plato", 404);
            return response;
        } catch (error) {
            throw error;
        }
    };

    update = async (id: string, userData: UserDB, body: Partial<FoodDB>) => {
        try {
            const currentFood = await this.getById(id)
            console.log("currentFood", currentFood)
            if (userData.restaurant?.toString() !== currentFood.restaurant.toString()) throw new UnauthorizedError("No tienes permiso para modificar este dato");
            const response = await this.dao.update(id, body);
            if (!response) throw new NotFoundError("No se encontro el plato");
            return response;
        } catch (error) {
            throw error;
        }
    };

    delete = async (id: string, userData: UserDB): Promise<FoodDB | null> => {
        try {
            const food = await this.getById(id);
            if (userData.restaurant?.toString() !== food.restaurant.toString()) throw new UnauthorizedError("No tienes permiso para modificar este dato");
            if (!food) throw new NotFoundError("No se encontro el plato");
            const response = await this.dao.delete(id);
            if (food.restaurant) await RestaurantModel.findByIdAndUpdate(food.restaurant, { $pull: { menu: id } })
            return response;
        } catch (error) {
            throw error;
        }
    };

}

export const foodService = new FoodService(foodMongoDao);