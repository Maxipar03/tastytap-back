import { categoryRepository } from "../repository/category.repository.js";
import { foodRepository } from "../repository/food.repository.js";
import { CategoryDB, CategoryDao } from "../types/category.js";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto.js";
import { Types } from "mongoose";
import cache from "../utils/cache.js";

export default class CategoryService {

    private repository: typeof categoryRepository

    constructor(repository: typeof categoryRepository) {
        this.repository = repository;
    }

    create = async (body: CreateCategoryDto): Promise<CategoryDB> => {
        const result = await this.repository.create(body);
        await cache.del(`categories:${body.restaurant}`);
        return result;
    };

    update = async (id: string | Types.ObjectId, body: UpdateCategoryDto): Promise<CategoryDB | null> => {
        const result = await this.repository.update(id, body);
        if (result) await cache.del(`categories:${result.restaurant}`);
        return result;
    };

    getByRestaurant = async (id: string | Types.ObjectId): Promise<any[]> => {
        const cacheKey = `categories:${id}`;
        const cached = await cache.get<any[]>(cacheKey);
        if (cached) return cached;

        const categories = await this.repository.getByRestaurant(id);
        await cache.set(cacheKey, categories, 600);
        return categories;
    };

    delete = async (id: string | Types.ObjectId): Promise<CategoryDB | null> => {
        await foodRepository.updateFoodsByCategoryToNull(id);
        const result = await this.repository.delete(id);
        if (result) await cache.del(`categories:${result.restaurant}`);
        return result;
    }
}

export const categoryService = new CategoryService(categoryRepository);