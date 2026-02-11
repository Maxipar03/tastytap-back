import { Document, Types } from "mongoose";
import { CreateRestaurantDto } from "../dto/restaurant.dto.js";

export interface OpeningHour {
    day: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";
    isOpen: boolean;
    periods: {
        open: string;
        close: string;
    }[];
}

export interface RestaurantDB extends Document {
    _id: Types.ObjectId;
    name: string;
    address: string;
    openingHours: OpeningHour[];
    phone?: string;
    email?: string;
    description: string;
    rating: number;
    stripeStatus: "pending" | "active" | "inactive"; // Tipado más estricto
    menu: Types.ObjectId[];
    numberTables: number;
    logo?: any;
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
}

export interface CreateRestaurantResponse {
    _id: any;
    restaurant: RestaurantDB;
    onboardingUrl: string;
}

export interface RestaurantService {
    getAll: () => Promise<RestaurantDB[]>;
    createOnboarding: (restaurantId: string) => Promise<{ url: string }>;
    create: (data: CreateRestaurantDto, userId: Types.ObjectId) => Promise<CreateRestaurantResponse>;
    getById: (id: string) => Promise<RestaurantDB | null>;
    update: (id: string, data: Partial<RestaurantDB>) => Promise<RestaurantDB | null>;
}

