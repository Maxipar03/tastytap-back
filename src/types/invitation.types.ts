import { Document, Types } from "mongoose";
import { UserRole } from "./user.types";

export interface InvitationDB extends Document {
    _id: Types.ObjectId;
    email: string;
    token: string;
    used: boolean;
    role: string;
    expiresAt: Date;
    restaurantId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvitationDao {
    create: (email: string, token: string, expiresAt: Date, role: string, restaurantId?: string) => Promise<InvitationDB>;
    getByToken: (token: string) => Promise<InvitationDB | null>;
    markAsUsed: (token: string, restaurantId: string) => Promise<InvitationDB | null>;
}

export interface InvitationService {
    createInvitation: (email: string, role: UserRole, restaurantId?: string) => Promise<{ message: string }>;
    verifyInvitationToken: (token: string) => Promise<{ valid: boolean; email?: string, token: string }>
}
