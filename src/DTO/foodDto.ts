import { FoodOption } from "../types/food.js";
import { Types } from "mongoose";

export interface CreateFoodDto {
    name: string;
    description: string;
    price: number;
    category: Types.ObjectId;
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
}
