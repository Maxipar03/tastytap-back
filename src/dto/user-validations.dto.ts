import { Document, Types } from "mongoose";

export interface UserValidationDTO {
    token: string;
    user: Types.ObjectId;
    type: string;
    used: boolean;
    expiresAt: Date;
}