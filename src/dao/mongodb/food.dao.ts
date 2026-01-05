import { FoodModel } from "./models/food.model.js";
import { FoodDB } from "../../types/food.js";
import { CreateFoodDto } from "../../dto/food.dto.js";
import MongoDao from "./mongo.dao.js";
import { MenuFiltersDto } from "../../dto/menu-filters.dto.js";
import { Model, Types } from "mongoose";

class FoodMongoDao extends MongoDao<FoodDB, CreateFoodDto> {

    constructor(model: Model<FoodDB>) {
        super(model);
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
}

export const foodMongoDao = new FoodMongoDao(FoodModel)