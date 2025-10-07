import { CategoryModel } from "./models/categoryModel.js";
import { CategoryDB } from "../../types/category.js";
import { BadRequestError } from "../../utils/customError.js";
import { CreateCategoryDto, UpdateCategoryDto } from "../../DTO/categoryDto.js";
import MongoDao from "./mongoDao.js";
import { Types } from "mongoose";
import { Model } from "mongoose";

class CategoryMongoDao extends MongoDao<CategoryDB, CreateCategoryDto> {
    constructor(model: Model<CategoryDB>) {
        super(model);
    }
    
    getByRestaurant = async (id: string | Types.ObjectId) => {
        try {
            if (!Types.ObjectId.isValid(id)) throw new BadRequestError("ID inválido");
            return await this.model.aggregate([
                { $match: { restaurant: new Types.ObjectId(id) } },
                {
                    $lookup: {
                        from: 'foods',
                        localField: '_id',
                        foreignField: 'category',
                        as: 'foods'
                    }
                },
                {
                    $addFields: {
                        foodCount: { $size: '$foods' }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        restaurant: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        foodCount: 1
                    }
                }
            ]);
        } catch (error) {
            console.error("Error en categoryByRestaurant:", error);
            throw error;
        }
    }

}

export const categoryMongoDao = new CategoryMongoDao(CategoryModel)