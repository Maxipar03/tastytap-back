import { Types } from "mongoose";

export interface CreateCategoryDto {
    name: string;
    restaurant: Types.ObjectId; 
}