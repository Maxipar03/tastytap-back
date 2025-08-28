import { Document, Types } from "mongoose";
import { CreateSeatDto } from "../DTO/createSeatDto.js";

export interface SeatDB extends Document {
    _id: Types.ObjectId;
    tableId: Types.ObjectId;
    userId?: Types.ObjectId | null;
    guestName?: string | null;
    sessionToken?: string | null;
    createdAt: Date;
    closedAt?: Date | null;
    isActive: boolean;
    updatedAt: Date;
}

export interface SeatDao {
    getByTableId: (tableId: string | Types.ObjectId, onlyActive?: boolean) => Promise<SeatDB[]>;
    getByObjectId: (id: string | Types.ObjectId) => Promise<SeatDB | null>;
    findOne: (filter: any) => Promise<SeatDB | null>;
    create: (body: CreateSeatDto) => Promise<SeatDB>;
    delete: (seatId: Types.ObjectId | string) => Promise<SeatDB | null>;
}

export interface SeatService {
    findOne: (query:any) => Promise<SeatDB | null>;
    getByTableId: (tableId: string | Types.ObjectId, onlyActive: boolean) => Promise<SeatDB[]>;
    create: (seatData: CreateSeatDto, restaurant: Types.ObjectId | string) => Promise<SeatDB>;
    delete: (seatId: string | Types.ObjectId, restaurant: string | Types.ObjectId) => Promise<SeatDB | null>;
    getByTableIdWithOrders: (tableId: string | Types.ObjectId) => Promise<any>;
}

