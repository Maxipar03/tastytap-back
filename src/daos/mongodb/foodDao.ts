import { FoodModel } from "./models/foodModel.js";
import { FoodDB } from "../../types/food.js";
import { CreateFoodDto } from "../../DTO/foodDto.js";
import MongoDao from "./mongoDao.js";
import { BadRequestError } from "../../utils/customError.js";
import { Model, Types } from "mongoose";

interface IMenuFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    itemName?: string;
    available?: boolean;
    search?: string;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
}

class FoodMongoDao extends MongoDao<FoodDB, CreateFoodDto> {
    constructor(model: Model<FoodDB>) {
        super(model);
    }

    async getByRestaurantId(restaurant: string | Types.ObjectId, filters: IMenuFilters = {}) {
        try {

            if (!Types.ObjectId.isValid(restaurant)) throw new BadRequestError("ID inválido");

            const menuMatch: any = {};

            const escapeRegex = (str: string): string => {
                return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };

            if (filters.category) {
                menuMatch.category = filters.category;
            }
            if (filters.minPrice) {
                menuMatch.price = { ...menuMatch.price, $gte: filters.minPrice };
            }
            if (filters.maxPrice) {
                menuMatch.price = { ...menuMatch.price, $lte: filters.maxPrice };
            }
            if (filters.search) {
                menuMatch.name = { $regex: escapeRegex(filters.search), $options: 'i' };
            }
            if (typeof filters.available === 'boolean') {
                menuMatch.available = filters.available;
            }
            if (typeof filters.isVegetarian === 'boolean') {
                menuMatch.isVegetarian = filters.isVegetarian;
            }
            if (typeof filters.isVegan === 'boolean') {
                menuMatch.isVegan = filters.isVegan;
            }
            if (typeof filters.isGlutenFree === 'boolean') {
                menuMatch.isGlutenFree = filters.isGlutenFree;
            }

            return await FoodModel.find({ restaurant: restaurant, ...menuMatch }).lean();
        } catch (error) {
            console.error("Error fetching food by restaurant ID:", error);
            throw error;
        }
    }

    async updateFoodsByCategoryToNull(categoryId: string | Types.ObjectId) {
        try {
            if (!Types.ObjectId.isValid(categoryId)) throw new BadRequestError("ID inválido");
            return await this.model.updateMany(
                { category: categoryId },
                { $set: { category: null } }
            );
        } catch (error) {
            console.error("Error updating foods category to null:", error);
            throw error;
        }
    }
}

export const foodMongoDao = new FoodMongoDao(FoodModel)