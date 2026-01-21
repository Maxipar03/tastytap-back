import { Document, Types } from "mongoose";

export interface RestaurantInvitationDB extends Document {
    _id: Types.ObjectId;
    email: string;
    token: string;
    used: boolean;
    scope: string;
    role: string;
    expiresAt: Date;
    restaurantId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface RestaurantInvitationDao {
    create: (email: string, token: string, expiresAt: Date, role: string, scope: string, restaurantId?: string) => Promise<RestaurantInvitationDB>;
    getByToken: (token: string) => Promise<RestaurantInvitationDB | null>;
    markAsUsed: (token: string, restaurantId: string) => Promise<RestaurantInvitationDB | null>;
}
