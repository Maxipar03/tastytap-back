import { OrderItem, PaymentMethod, OrderPricing, OrderStatus } from "../types/order.js";
import { Types } from "mongoose";

export interface CreateOrderDto {
    items: OrderItem[];
    tableId?: Types.ObjectId | undefined;
    restaurant: Types.ObjectId;
    waiterId?: Types.ObjectId | undefined;
    status: OrderStatus;
    clientId?: Types.ObjectId | undefined;
    userName?: string;
    pricing: OrderPricing;
    paymentMethod?: PaymentMethod;
    isPaid: boolean;
    orderType: "dine-in" | "togo";
    manual?: boolean;
}