import { OrderItem, PaymentMethod, OrderPricing, OrderStatus } from "../types/order.js";
import { Types } from "mongoose";

export interface CreateOrderDto {
    items: OrderItem[];
    tableId?: Types.ObjectId | undefined;
    restaurant: Types.ObjectId;
    waiterId?: Types.ObjectId | undefined;
    status: OrderStatus;
    clientId?: Types.ObjectId | undefined;
    userName?: string | undefined;
    pricing: OrderPricing;
    paymentMethod?: PaymentMethod;
    isPaid: boolean;
    orderType: "dine-in" | "togo";
    manual?: boolean;
}

export interface CreateOrderBodyDto {
    items: OrderItem[];
    pricing: OrderPricing;
    status: OrderStatus;
    orderType: "dine-in" | "togo";
    guestName?: string | undefined;
}

export interface UpdateOrderStatusDto {
    status: OrderStatus;
    deletionReason?: string;
}

export interface UpdateItemStatusDto {
    status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
    deletionReason?: string;
}

export interface CreateManualOrderDto {
    items: OrderItem[];
    tableId: Types.ObjectId;
    pricing: OrderPricing;
}