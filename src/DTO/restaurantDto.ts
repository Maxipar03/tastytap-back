import { Types } from "mongoose";

export interface CreateRestaurantDto {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    description: string;
    numberTables: number;
}