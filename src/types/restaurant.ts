import { Document, Types } from "mongoose";
import { CreateRestaurantDto } from "../dto/restaurant.dto.js";

export interface RestaurantDB extends Document {
    _id: Types.ObjectId;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    description: string;
    rating: number;
    stripeStatus: string,
    menu: Types.ObjectId[];
    numberTables: number;
    logo?: string;
    stripeAccountId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface RestaurantDao {
    create: (body: CreateRestaurantDto) => Promise<RestaurantDB>;
    getAll: () => Promise<RestaurantDB[]>;
    getById: (id: string) => Promise<RestaurantDB | null>;
    getByFilter: (filter: Partial<RestaurantDB>) => Promise<RestaurantDB | null>;
    update: (id: string, body: Partial<RestaurantDB>) => Promise<RestaurantDB | null>;
    delete: (id: string) => Promise<RestaurantDB | null>;
}

export interface CreateRestaurantResponse {
    _id: any;
    restaurant: RestaurantDB;
    onboardingUrl: string;
}

export interface RestaurantService {
    getAll: () => Promise<RestaurantDB[]>;
    create: (data: CreateRestaurantDto) => Promise<CreateRestaurantResponse>;
    getById: (id: string) => Promise<RestaurantDB | null>;
    update: (id: string, data: Partial<RestaurantDB>) => Promise<RestaurantDB | null>;
    delete: (id: string) => Promise<RestaurantDB | null>;
}

