import { BaseRepository } from "./base.repository.js";
import { FoodDB } from "../types/food.js";
import { CreateFoodDto } from "../dto/food.dto.js";
import { foodMongoDao } from "../dao/mongodb/food.dao.js";
import { MenuFiltersDto } from "../dto/menu-filters.dto.js";
import { Types } from "mongoose";
import { FoodModel } from "../dao/mongodb/models/food.model.js";

class FoodRepository extends BaseRepository<FoodDB, CreateFoodDto> {
    constructor() {
        super(foodMongoDao);
    }

    private buildMenuQuery(filters: MenuFiltersDto): any {
        const menuMatch: any = {};
        const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        if (filters.search) {
            const escapedSearch = escapeRegex(filters.search);
            menuMatch.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { description: { $regex: escapedSearch, $options: 'i' } }
            ];
        }

        if (filters.category) menuMatch.category = filters.category;
        if (filters.available === true) menuMatch.stock = { $gt: 0 };
        if (filters.isVegetarian === true) menuMatch.isVegetarian = true;
        if (filters.isVegan === true) menuMatch.isVegan = true;
        if (filters.isGlutenFree === true) menuMatch.isGlutenFree = true;

        return menuMatch;
    }

    async getByRestaurant(restaurant: string | Types.ObjectId, filters: MenuFiltersDto = {}): Promise<FoodDB[]> {
        const menuMatch = this.buildMenuQuery(filters);
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        
        return await FoodModel.find({ restaurant: restaurant, ...menuMatch })
            .skip(skip)
            .limit(limit)
            .lean();
    }

    async updateFoodsByCategoryToNull(categoryId: string | Types.ObjectId) {
        return this.dao.updateFoodsByCategoryToNull(categoryId);
    }

    async decreaseStock(foodId: string | Types.ObjectId, quantity: number, session?: any) {
        return this.dao.decreaseStock(foodId, quantity, session);
    }
}

export const foodRepository = new FoodRepository();
