import { categoryMongoDao } from "../daos/mongodb/categoryDao.js";
import { CategoryDB, CategoryDao } from "../types/category.js";
import { CreateCategoryDto } from "../DTO/categoryDto.js";
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

    delete = async (id: string | Types.ObjectId): Promise<CategoryDB | null> => {
        try {
            return await this.dao.delete(id);
        } catch (error) {
            throw error;
        }
    }

    categoryByRestaurant = async (id: string | Types.ObjectId): Promise<CategoryDB[]> => {
        try {
            return await this.dao.categoryByRestaurant(id);
        } catch (error) {
            throw error;
        }
    }

    getByRestaurant = async (id: string | Types.ObjectId): Promise<CategoryDB[]> => {
        try {
            return await this.dao.getByRestaurant(id);
        } catch (error) {
            throw error;
        }
    }
}

export const categoryService = new CategoryService(categoryMongoDao);