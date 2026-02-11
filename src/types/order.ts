// src/types/order.ts
import { Document, Types } from "mongoose";
import { CreateOrderDto } from "../dto/order.dto.js";

export type ItemStatus = "awaiting_payment" | "pending" | "preparing" | "ready" | "delivered" | "cancelled" | "cashed";

export type OrderStatus = "open" | "awaiting_payment" | "paid" | "cancelled";

export type PaymentMethod = "cash" | "card";

export interface OrderFilters {
    status?: string;
    fromDate?: string;
    toDate?: string;
    waiter?: string | Types.ObjectId;
    currentWaiterId?: string | Types.ObjectId;
    search?: string;
    page?: number;
    limit?: number;
    includeDetails?: boolean;
}

export interface OrderItemOptionValue {
    label: string;
    price: number;
}

export interface OrderItemOption {
    name: string;
    values: OrderItemOptionValue[];
}

export interface OrderItem {
    _id: any;
    foodId: Types.ObjectId;
    foodName: string;
    quantity: number;
    price: number;
    options?: OrderItemOption[];
    notes?: string;
    status: ItemStatus;
    deletionReason?: string;
}

export interface OrderPricing {
    subtotal: number;
    tax: number;
    total: number;
}

export interface OrderDB extends Document {
    _id: Types.ObjectId;
    items: OrderItem[];
    tableId?: Types.ObjectId;
    receipt: boolean;
    activeSession?: Types.ObjectId;
    restaurant: Types.ObjectId;
    waiterId?: Types.ObjectId;
    status: OrderStatus;
    clientId?: Types.ObjectId;
    userName?: string;
    manual?: boolean;
    pricing: OrderPricing;
    paymentMethod: PaymentMethod;
    isPaid: boolean;
    orderType: "dine-in" | "togo";
    cancellationReason?: string;
    cancelledBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderDao {
    create: (body: CreateOrderDto, session?: any) => Promise<OrderDB>;
    update: (id: string | Types.ObjectId, body: Partial<OrderDB>, session?: any) => Promise<OrderDB | null>;
    updateStatusItems: (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, status: ItemStatus, deletionReason?: string) => Promise<OrderDB | null>;
    addItemsToOrder: (orderId: string | Types.ObjectId, items: OrderItem[], session?: any) => Promise<OrderDB | null>;
    getByRestaurantId: (restaurant: string | Types.ObjectId, filters: OrderFilters) => Promise<any>;
    getById: (id: string | Types.ObjectId, populate?: boolean) => Promise<OrderDB | null>;
    getByUserId: (userId: string | Types.ObjectId) => Promise<OrderDB[]>;
}

export interface CreateOrderResponse {
    order: OrderDB;
    token: string;
}

export interface OrderService {
    create(orderData: CreateOrderDto, orderId: string): Promise<CreateOrderResponse>;
    validateTableForOrder(tableId: Types.ObjectId): Promise<void>;
    selectPayMethod(idOrder: string | Types.ObjectId, paymentMethod: PaymentMethod): Promise<OrderDB | null>;
    updateStatusOrder(id: string | Types.ObjectId, orderData: Partial<OrderDB>, restaurant: string | Types.ObjectId, waiterId?: string | Types.ObjectId): Promise<OrderDB | null>;
    updateStatusItems(orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, status: ItemStatus, deletionReason?: string): Promise<OrderDB | null>;
    addItemsToOrder(orderId: string | Types.ObjectId, items: OrderItem[]): Promise<OrderDB | null>;
    getByRestaurantId(restaurant: string | Types.ObjectId, filters: OrderFilters): Promise<any>;
    getById: (id: string | Types.ObjectId, populate?: boolean) => Promise<OrderDB | null>;
    getByUserId(userId: string | Types.ObjectId): Promise<OrderDB[]>;
}

