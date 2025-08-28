import { CategoryModel } from "./models/categoryModel.js";
import { CategoryDB } from "../../types/category.js";
import { CreateCategoryDto } from "../../DTO/categoryDto.js";
import MongoDao from "./mongoDao.js";
import { Types } from "mongoose";
import { Model } from "mongoose";

class CategoryMongoDao extends MongoDao <CategoryDB, CreateCategoryDto> {
    constructor(model: Model<CategoryDB>) {
        super(model);
    }

    categoryByRestaurant = async (id: string | Types.ObjectId): Promise<CategoryDB[]> => {
        try {
            return (await this.model.find({ restaurant: id }).lean()) as CategoryDB[];
        } catch (error) {
            console.error("Error en categoryByRestaurant:", error);
            throw error;
        }
    }

    getByRestaurant = async (id: string | Types.ObjectId) => {
        try {
            return (await this.model.find({ restaurant: id }).lean()) as CategoryDB[];
        } catch (error) {
            console.error("Error en categoryByRestaurant:", error);
            throw error;
        }
    }

}

export const categoryMongoDao = new CategoryMongoDao(CategoryModel)