import { Types } from "mongoose";

export interface CreateSeatDto {
    tableId: Types.ObjectId;
    userId?: Types.ObjectId | null;
    guestName?: string | null;
    sessionToken?: string | null;
    closedAt?: Date | null;
    isActive: boolean;
}