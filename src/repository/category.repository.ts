import { BaseRepository } from "./base.repository.js";
import { CategoryDB } from "../types/category.js";
import { CreateCategoryDto } from "../dto/category.dto.js";
import { categoryMongoDao } from "../dao/mongodb/category.dao.js";
import { Types } from "mongoose";
import { CategoryModel } from "../dao/mongodb/models/category.model.js";

class CategoryRepository extends BaseRepository<CategoryDB, CreateCategoryDto> {
    constructor() {
        super(categoryMongoDao);
    }

    async getByRestaurant(id: string | Types.ObjectId) {
        return await CategoryModel.aggregate([
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

export const categoryRepository = new CategoryRepository();
