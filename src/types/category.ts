import { Document, Types } from "mongoose";
import { CreateCategoryDto } from "../DTO/categoryDto.js";

export interface CategoryDB extends Document {
    _id: Types.ObjectId;
    name: string;
    restaurant: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface CategoryDao {
    create: (body: CreateCategoryDto) => Promise<CategoryDB>;
    delete: (id: string |  Types.ObjectId) => Promise<CategoryDB | null>;
    categoryByRestaurant: (id: string | Types.ObjectId) => Promise<CategoryDB[]>;
    getByRestaurant: (id: string | Types.ObjectId) => Promise<CategoryDB[]>;
}

export interface CategoryService {
    create(categoryData: Partial<CategoryDB>): Promise<CategoryDB>;
    delete(id: string | Types.ObjectId): Promise<CategoryDB | null>;
    categoryByRestaurant(id: string | Types.ObjectId): Promise<CategoryDB[]>;
    getByRestaurant(id: string | Types.ObjectId): Promise<CategoryDB[]>;
}