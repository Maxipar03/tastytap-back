import { Document, Types } from "mongoose";

export type SessionStatus = "active" | "closed";

export interface TableSessionDB extends Document {
    _id: Types.ObjectId;
    restaurant: Types.ObjectId;
    table: Types.ObjectId;
    status: SessionStatus;
    orders: Types.ObjectId[];
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface TableSessionDao {
    getByTableId: (tableId: string | Types.ObjectId) => Promise<TableSessionDB | null>;
    getActiveByTableId: (tableId: string | Types.ObjectId) => Promise<TableSessionDB | null>;
    getActiveSessionsByRestaurant: (restaurant: string | Types.ObjectId) => Promise<TableSessionDB[]>;
    createSession: (restaurant: string | Types.ObjectId, table: string | Types.ObjectId) => Promise<TableSessionDB>;
    closeSession: (id: string | Types.ObjectId) => Promise<TableSessionDB | null>;
    addOrderToSession: (sessionId: string | Types.ObjectId, orderId: string | Types.ObjectId) => Promise<TableSessionDB | null>;
    updateTotalAmount: (sessionId: string | Types.ObjectId) => Promise<TableSessionDB | null>;
}