import { CategoryModel } from "./models/categoryModel.js";
import { CategoryDB } from "../../types/category.js";
import { CreateCategoryDto } from "../../DTO/categoryDto.js";
import MongoDao from "./mongoDao.js";
import { Types } from "mongoose";
import { Model } from "mongoose";

class CategoryMongoDao extends MongoDao<CategoryDB, CreateCategoryDto> {
    constructor(model: Model<CategoryDB>) {
        super(model);
    }
    
    getByRestaurant = async (id: string | Types.ObjectId) => {
        try {
            return await this.model.aggregate([
                { $match: { restaurant: new Types.ObjectId(id) } },
                {
                    $lookup: {
                        from: 'foods',
                        localField: '_id',
                        foreignField: 'category',
                        as: 'foods',
                        pipeline: [{ $project: { _id: 1 } }]
                    }
                },
                {
                    $addFields: {
                        foodCount: { $size: '$foods' },
                        foods: '$$REMOVE'
                    }
                }
            ], { allowDiskUse: true });
        } catch (error) {
            console.error("Error en categoryByRestaurant:", error);
            throw error;
        }
    }

}

export const categoryMongoDao = new CategoryMongoDao(CategoryModel)