import { OrderItem, PaymentMethod, OrderPricing, OrderStatus } from "../types/order.js";
import { Types } from "mongoose";

export interface CreateOrderDto {
    items: OrderItem[];
    tableId: Types.ObjectId;
    restaurant: Types.ObjectId;
    waiterId: Types.ObjectId;
    status: OrderStatus;
    clientId?: Types.ObjectId;
    userName?: string;
    pricing: OrderPricing;
    paymentMethod?: PaymentMethod;
    isPaid: boolean;
}