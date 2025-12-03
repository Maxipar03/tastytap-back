import { FoodModel } from "./models/foodModel.js";
import { FoodDB } from "../../types/food.js";
import { CreateFoodDto } from "../../DTO/foodDto.js";
import MongoDao from "./mongoDao.js";
import { MenuFiltersDto } from "../../DTO/menuFiltersDto.js";
import { Model, Types } from "mongoose";

class FoodMongoDao extends MongoDao<FoodDB, CreateFoodDto> {

    constructor(model: Model<FoodDB>) {
        super(model);
    }

    private _buildMenuQuery(filters: MenuFiltersDto): any {
        const menuMatch: any = {};

        const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        if (filters.search) {
            const escapedSearch = escapeRegex(filters.search);
            menuMatch.$or = [
                { name: { $regex: escapedSearch, $options: 'i' } },
                { description: { $regex: escapedSearch, $options: 'i' } }
            ];
        };

        if (filters.category) menuMatch.category = filters.category;
        
        if (filters.available === true) menuMatch.stock = { $gt: 0 };
    
        if (filters.isVegetarian === true) menuMatch.isVegetarian = true;

        if (filters.isVegan === true) menuMatch.isVegan = true;
        
        if (filters.isGlutenFree === true) menuMatch.isGlutenFree = true;

        return menuMatch;
    }


    async getByRestaurant(restaurant: string | Types.ObjectId, filters: MenuFiltersDto = {}) {
        try {
            const menuMatch = this._buildMenuQuery(filters);
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const skip = (page - 1) * limit;
            
            const query = this.model.find({ restaurant: restaurant, ...menuMatch })
                .skip(skip)
                .limit(limit)
                .lean();
            
            return await query;
        } catch (error) {
            console.error("Error fetching food by restaurant ID:", error);
            throw error;
        }
    }

    async updateFoodsByCategoryToNull(categoryId: string | Types.ObjectId) {
        try {
            return await this.model.updateMany(
                { category: categoryId },
                { $set: { category: null } }
            );
        } catch (error) {
            console.error("Error updating foods category to null:", error);
            throw error;
        }
    }

    async decreaseStock(foodId: string | Types.ObjectId, quantity: number, session?: any) {
        try {
            const options = session ? { new: true, session } : { new: true };
            return await this.model.findByIdAndUpdate(
                foodId,
                { $inc: { stock: -quantity } },
                options
            );
        } catch (error) {
            console.error("Error decreasing stock:", error);
            throw error;
        }
    }
}

export const foodMongoDao = new FoodMongoDao(FoodModel)