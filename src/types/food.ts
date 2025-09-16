import { Document, Types } from "mongoose";
import { CategoryDB } from "./category.js";
import { CreateFoodDto } from "../DTO/foodDto.js";
import { MenuFiltersDto } from "../DTO/menuFiltersDto.js";

export interface FoodOptionValue {
    label: string;
    price: number;
}

export interface FoodOption {
    type: 'radio' | 'checkbox';
    name: string;
    values: FoodOptionValue[];
}

export interface FoodDB extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    price: number;
    category: Types.ObjectId | CategoryDB | null;
    options?: FoodOption[];
    available: boolean;
    stock: number;
    ingredients: string[];
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    restaurant: Types.ObjectId;
    spicyLevel: number;
    image: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface FoodDao {
    create: (body: CreateFoodDto) => Promise<FoodDB>;
    delete: (id: string) => Promise<FoodDB | null>;
    getAll: () => Promise<FoodDB[]>;
    update: (id: string, body: Partial<FoodDB>) => Promise<FoodDB | null>;
    getById: (id: string) => Promise<FoodDB | null>;
    getByRestaurantId: (restaurantId: string | Types.ObjectId, filter: MenuFiltersDto) => Promise<FoodDB[]>;
    updateFoodsByCategoryToNull: (categoryId: string | Types.ObjectId) => Promise<any>;
}

export interface FoodService {
    getAll(): Promise<FoodDB[]>;
    create(foodData: CreateFoodDto): Promise<FoodDB>;
    getById(id: string): Promise<FoodDB | null>;
    update(id: string, userData: any, updateData: any): Promise<FoodDB | null>;
    delete(id: string, userData: any): Promise<FoodDB | null>;
    getByRestaurantId(restaurantId: string | Types.ObjectId, filter: MenuFiltersDto): Promise<FoodDB[]>;
}
