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
}

export const categoryMongoDao = new CategoryMongoDao(CategoryModel)