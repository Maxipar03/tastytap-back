import { categoryMongoDao } from "../dao/mongodb/category.dao.js";
import { foodMongoDao } from "../dao/mongodb/food.dao.js";
import { CategoryDB, CategoryDao } from "../types/category.js";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto.js";
import { Types } from "mongoose";
import cache from "../utils/cache.js";

export default class CategoryService {

    private dao: typeof categoryMongoDao

    constructor(dao: typeof categoryMongoDao) {
        this.dao = dao;
    }

    create = async (body: CreateCategoryDto): Promise<CategoryDB> => {
        const result = await this.dao.create(body);
        await cache.del(`categories:${body.restaurant}`);
        return result;
    };

    update = async (id: string | Types.ObjectId, body: UpdateCategoryDto): Promise<CategoryDB | null> => {
        const result = await this.dao.update(id, body);
        if (result) await cache.del(`categories:${result.restaurant}`);
        return result;
    };

    getByRestaurant = async (id: string | Types.ObjectId): Promise<CategoryDB[]> => {
        const cacheKey = `categories:${id}`;
        const cached = await cache.get<CategoryDB[]>(cacheKey);
        if (cached) return cached;

        const categories = await this.dao.getByRestaurant(id);
        await cache.set(cacheKey, categories, 600);
        return categories;
    };

    delete = async (id: string | Types.ObjectId): Promise<CategoryDB | null> => {
        await foodMongoDao.updateFoodsByCategoryToNull(id);
        const result = await this.dao.delete(id);
        if (result) await cache.del(`categories:${result.restaurant}`);
        return result;
    }
}

export const categoryService = new CategoryService(categoryMongoDao);