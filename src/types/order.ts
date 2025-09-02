// src/types/order.ts
import { Document, Types } from "mongoose";
import { CreateOrderDto } from "../DTO/orderDto.js";

export type ItemStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

export type OrderStatus = ItemStatus;

export type PaymentMethod = "cash" | "card" | "mobile";

export interface OrderFilters {
    status?: string;
    fromDate?: string;
    toDate?: string;
    waiter?: string  | Types.ObjectId;
    currentWaiterId?: string | Types.ObjectId;
    search?: string;
}

export interface OrderItemOption {
    name: string;
    value: any; 
}

export interface OrderItem {
    foodName: string;
    quantity: number;
    price: number;
    options: OrderItemOption[];
    notes?: string;
    status: ItemStatus;
}

export interface OrderPricing {
    subtotal: number;
    tax: number;
    total: number;
}

export interface OrderDB extends Document {
    _id: Types.ObjectId;
    items: OrderItem[];
    tableId: Types.ObjectId;
    restaurant: Types.ObjectId;
    seatId: Types.ObjectId;
    waiterId?: Types.ObjectId;
    status: OrderStatus;
    clientId?: Types.ObjectId;
    userName?: string;
    pricing: OrderPricing;
    paymentMethod: PaymentMethod;
    isPaid: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderDao{
        create: (body: CreateOrderDto) => Promise<OrderDB>;
        update: (id:string | Types.ObjectId, body: Partial<OrderDB>) => Promise<OrderDB | null>;
        updateStatus: (itemId:string | Types.ObjectId, orderId:string | Types.ObjectId, status: OrderStatus) => Promise<OrderDB | null>;
        getByRestaurantId: (restaurant: string | Types.ObjectId, filters: OrderFilters) => Promise<OrderDB[]>;
        getByUserId: (userId: string | Types.ObjectId) => Promise<OrderDB[]>;
        getBySeatId: (seatId: string | Types.ObjectId) => Promise<OrderDB[]>;
}

export interface OrderService {
    create(orderData: CreateOrderDto): Promise<OrderDB>;
    update(id: string | Types.ObjectId, orderData: Partial<OrderDB>): Promise<OrderDB | null>;
    updateStatus(itemId: string | Types.ObjectId, orderId: string | Types.ObjectId, status: OrderStatus): Promise<OrderDB | null>;
    getByRestaurantId(restaurant: string | Types.ObjectId, filters: OrderFilters): Promise<OrderDB[]>;
    getByUserId(userId: string | Types.ObjectId): Promise<OrderDB[]>;
    getBySeatId(seatId: string | Types.ObjectId): Promise<OrderDB[]>;
}

