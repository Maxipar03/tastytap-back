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
    location: {
        type: "Point";
        coordinates: [number, number];
    };
    openingHours: OpeningHour[];
    phone?: string;
    email?: string;
    description: string;
    rating: number;
    stripeStatus: "PENDING" | "ACTIVE" | "INACTIVE";
    menu: Types.ObjectId[];
    logo?: any;
    stripeAccountId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRestaurantResponse {
    _id: any;
    restaurant: RestaurantDB;
    onboardingUrl: string;
}

export interface RestaurantDao {
    create: (body: CreateRestaurantDto) => Promise<RestaurantDB>;
    findByLocation: (params: { lng: number, lat: number, radiusMeters: number}) => Promise<RestaurantDB[]>;
    getAll: () => Promise<RestaurantDB[]>;
    getById: (id: string) => Promise<RestaurantDB | null>;
    getByFilter: (filter: Partial<RestaurantDB>) => Promise<RestaurantDB | null>;
    update: (id: string, body: Partial<RestaurantDB>) => Promise<RestaurantDB | null>;
}

export interface RestaurantService {
    getAll: () => Promise<RestaurantDB[]>;
    discoverRestaurants: (params: { lat?: number | undefined, lng?: number | undefined, radius: number, ip: string }) => Promise<{ source: string, location: { lat: number, lng: number }, results: RestaurantDB[] }>;
    createOnboarding: (restaurantId: string) => Promise<{ url: string }>;
    create: (data: CreateRestaurantDto, userId: Types.ObjectId) => Promise<CreateRestaurantResponse>;
    getById: (id: string) => Promise<RestaurantDB | null>;
    update: (id: string, data: Partial<RestaurantDB>) => Promise<RestaurantDB | null>;
}

