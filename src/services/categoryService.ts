import { categoryMongoDao } from "../daos/mongodb/categoryDao.js";
import { foodMongoDao } from "../daos/mongodb/foodDao.js";
import { CategoryDB, CategoryDao } from "../types/category.js";
import { CreateCategoryDto, UpdateCategoryDto } from "../DTO/categoryDto.js";
import { Types } from "mongoose";

export default class CategoryService { 

    private dao: CategoryDao

    constructor(dao: CategoryDao) {
        this.dao = dao;
    }

    create = async (body: CreateCategoryDto): Promise<CategoryDB> => {
        try {
            return await this.dao.create(body);
        } catch (error) {
            throw error;
        }
    }

    update = async (id: string | Types.ObjectId, body: UpdateCategoryDto): Promise<CategoryDB | null> => {
        try {
            return await this.dao.update(id, body);
        } catch (error) {
            throw error;
        }
    }

    delete = async (id: string | Types.ObjectId): Promise<CategoryDB | null> => {
        try {
            // Actualizar todos los productos que tienen esta categoría para que tengan category: null
            await foodMongoDao.updateFoodsByCategoryToNull(id);
            
            // Eliminar la categoría
            return await this.dao.delete(id);
        } catch (error) {
            throw error;
        }
    }

    getByRestaurant = async (id: string | Types.ObjectId): Promise<any[]> => {
        try {
            return await this.dao.getByRestaurant(id);
        } catch (error) {
            throw error;
        }
    }
}

export const categoryService = new CategoryService(categoryMongoDao);