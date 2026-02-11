import { Document, Types } from "mongoose";

export interface UserValidationDB extends Document {
    _id: Types.ObjectId;
    token: string;
    user: Types.ObjectId;
    type: string;
    used: boolean;
    createdAt: Date;
    expiresAt: Date;
}

export interface UserValidationDao {
    create: (data: any) => Promise<UserValidationDB>;
    getByToken: (token: string) => Promise<UserValidationDB | null>
    update: (id: Types.ObjectId, body: any) => Promise<UserValidationDB | null>;
}

export interface UserValidationService {
    CreateUserValidation: (userId: Types.ObjectId) => Promise<void | null>;
    validateToken: (token: string) => Promise<UserValidationDB | null>;
    getByToken: (token: string) => Promise<UserValidationDB | null>;
}