import { CategoryModel } from "./models/category.model.js";
import { CategoryDB } from "../../types/category.js";
import { CreateCategoryDto } from "../../dto/category.dto.js";
import MongoDao from "./mongo.dao.js";
import { Types } from "mongoose";
import { Model } from "mongoose";

class CategoryMongoDao extends MongoDao<CategoryDB, CreateCategoryDto> {
    constructor(model: Model<CategoryDB>) {
        super(model);
    }

    async getByRestaurant(id: string | Types.ObjectId): Promise<CategoryDB[]> {
        return await this.model.aggregate([
            { $match: { restaurant: new Types.ObjectId(id.toString()) } },
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
    }
}

export const categoryMongoDao = new CategoryMongoDao(CategoryModel)