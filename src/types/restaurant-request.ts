import { Document, Types } from "mongoose";

export interface RestaurantRequestDB extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    address: string;
    city: string;
    shopType: string;
    email: string;
    statusRequest: "PENDING" | "APPROVED" | "REJECTED";
    restaurantName: string;
    phone: string;
    estimatedTables: number;
    termsAccepted: boolean;
}

export interface RestaurantRequestDao {
    create: (data: any) => Promise<RestaurantRequestDB>;
    update: (id: string | Types.ObjectId, body: Partial<RestaurantRequestDB>) => Promise<RestaurantRequestDB | null>;
}

export interface RestaurantRequestServices {
    createRestaurantRequest: (id: Types.ObjectId, body: any) => Promise<RestaurantRequestDB>;
    approveRequest: (id: string) => Promise<RestaurantRequestDB | null>;
    rejectRequest: (id: string) => Promise<RestaurantRequestDB | null>;
}