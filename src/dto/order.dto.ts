import { OrderItem, PaymentMethod, OrderPricing } from "../types/order.types.js";
import { Types } from "mongoose";

export interface CreateOrderDto {
    items: CreateOrderItems[];
    restaurant: Types.ObjectId;
    guestId: string;
    clientId?: Types.ObjectId | undefined;
    userName: string;
    pricing: OrderPricing;
    paymentMethod?: PaymentMethod;
    paymentStatus: "PENDING";
}

export interface OrderItemOption {
    optionId: Types.ObjectId;
    valueIds: Types.ObjectId[];
}

export interface CreateOrderItems {
    foodId: Types.ObjectId;
    foodName: string;
    quantity: number;
    price: number;
    options?: OrderItemOption[];
    notes?: string;
    deletionReason?: string;
}

export interface CreateOrderBodyDto {
    items: CreateOrderItems[];
    pricing: OrderPricing;
    guestName: string;
    paymentMethod: PaymentMethod;
    restaurant: { id: Types.ObjectId };
}

export interface UpdateOrderBody {
    paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
}

export interface UpdateItemStatusDto {
    status: "PENDING" | "PREPARING" | "READY" | "DELIVERED";
}

export interface CreateManualOrderDto {
    items: OrderItem[];
    tableId: Types.ObjectId;
    pricing: OrderPricing;
}