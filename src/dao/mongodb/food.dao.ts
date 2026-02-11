import { FoodModel } from "./models/food.model.js";
import { FoodDB } from "../../types/food.js";
import { PaginateResult } from "../../types/express.js";
import { CreateFoodDto } from "../../dto/food.dto.js";
import MongoDao from "./mongo.dao.js";
import { MenuFiltersDto } from "../../dto/menu-filters.dto.js";
import { Model, Types } from "mongoose";


class FoodMongoDao extends MongoDao<FoodDB, CreateFoodDto> {

    constructor(model: Model<FoodDB>) {
        super(model);
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

    async updateFoodsByCategoryToNull(categoryId: string | Types.ObjectId) {
        return await this.model.updateMany(
            { category: categoryId },
            { $set: { category: null } }
        );
    }

    async decreaseStock(foodId: string | Types.ObjectId, quantity: number, session?: any) {
        const options = session ? { new: true, session } : { new: true };
        return await this.model.findByIdAndUpdate(
            foodId,
            { $inc: { stock: -quantity } },
            options
        );
    }

    async getByRestaurant(restaurant: string | Types.ObjectId, filters: MenuFiltersDto = {}): Promise<PaginateResult<FoodDB>> {
        const menuMatch = this.buildMenuQuery(filters);
        const options = {
            page: filters.page || 1,
            limit: filters.limit || 10,
            lean: true
        };

        return await (this.model as any).paginate({ restaurant: restaurant, ...menuMatch }, options);
    }
}

export const foodMongoDao = new FoodMongoDao(FoodModel)