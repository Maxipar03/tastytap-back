import { Document, Types } from "mongoose";

export interface TableWithDetails {
    _id: Types.ObjectId;
    restaurant?: Types.ObjectId;
    tableNumber?: number;
    state: TableState;
    isActive: boolean;
    waiterServing?: Types.ObjectId | null;
    activeSession?: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
    orders: any[];
}

export type TableState = "available" | "occupied" | "reserved";

export interface TableDB extends Document {
    _id: Types.ObjectId;
    restaurant?: Types.ObjectId;
    tableNumber?: number;
    state: TableState;
    isActive: boolean;
    waiterServing?: Types.ObjectId | null;
    activeSession?: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TableDao {
    getByRestaurant: (restaurant: string | Types.ObjectId) => Promise<TableDB[]>;
    getById: (tableId: string | Types.ObjectId) => Promise<TableDB | null>;
    update: (tableId: string | Types.ObjectId, updateData: any) => Promise<TableDB | null>;
}

export interface TableService {
    getByRestaurat: (restaurant: string | Types.ObjectId) => Promise<TableDB[]>;
    getById: (tableId: string | Types.ObjectId) => Promise<TableDB | null>;
    update: (tableId: string | Types.ObjectId, data: Partial<TableDB>, restaurant: string | Types.ObjectId) => Promise<TableDB | null>;
}