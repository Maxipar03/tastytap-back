// src/types/order.ts
import { Document, Types } from "mongoose";
import { CreateOrderDto } from "../dto/order.dto.js";

export type OrderStatus = "DRAFT" | "PENDING" | "COMPLETED" | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod = "CASH" | "CARD";

export interface OrderFilters {
    fromDate: string;
    toDate: string;
    search?: string;
    page?: number;
    limit?: number;
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
    _id?: any;
    foodId: Types.ObjectId;
    foodName: string;
    quantity: number;
    price: number;
    options?: OrderItemOption[];
    notes?: string;
    deletionReason?: string;
}

export interface OrderPricing {
    subtotal: number;
    tax: number;
    total: number;
}

export interface OrderDB extends Document {
    _id: Types.ObjectId;
    guestId: string;
    items: OrderItem[];
    receipt: boolean;
    restaurant: Types.ObjectId;
    paymentSecret: string;
    status: OrderStatus;
    paymentIntentId: string;
    paymentStatus: PaymentStatus;
    clientId?: Types.ObjectId;
    userName: string;
    pendingAt?: Date;
    completedAt?: Date;
    deliveredAt?: Date;
    pricing: OrderPricing;
    paymentMethod: PaymentMethod;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderDao {
    create: (body: CreateOrderDto, session?: any) => Promise<OrderDB>;
    update: (id: string | Types.ObjectId, body: Partial<OrderDB>, session?: any) => Promise<OrderDB | null>;
    getOrdersGuest: (guestId: string) => Promise<OrderDB[]>;
    // updateStatusItems: (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, status: ItemStatus, deletionReason?: string) => Promise<OrderDB | null>;
    getByRestaurantId: (restaurant: string | Types.ObjectId, filters: OrderFilters) => Promise<any>;
    getActiveByRestaurant: (restaurant: string | Types.ObjectId) => Promise<OrderDB[]>;
    getByIdWithPopulate: (id: string | Types.ObjectId) => Promise<OrderDB | null>;
    getById: (id: string | Types.ObjectId, populate?: boolean) => Promise<OrderDB | null>;
}

export interface CreateOrderResponse {
    order: OrderDB;
    paymentIntent: any;
}

export interface OrderService {
    create(orderData: CreateOrderDto): Promise<CreateOrderResponse>;
    // updatePaymentOrder(id: string | Types.ObjectId, paymentStatus: PaymentStatus, restaurant: string | Types.ObjectId): Promise<OrderDB | null>;
    // updateStatusOrder(id: string | Types.ObjectId, status: OrderStatus, restaurant: string | Types.ObjectId): Promise<OrderDB | null>;
    updateOrderFields(id: string | Types.ObjectId, restaurant: string | Types.ObjectId, updates: Partial<OrderDB>): Promise<OrderDB | null>;
    // updateStatusItems(orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: ItemStatus): Promise<OrderDB | null>;
    getByRestaurantId(restaurant: string | Types.ObjectId, filters: OrderFilters): Promise<any>;
    getActiveRestaurant: (restaurant: string | Types.ObjectId) => Promise<OrderDB[]>;
    getByIdClient: (id: string | Types.ObjectId, guestId: string) => Promise<OrderDB | null>;
    getOrdersGuest(guestId: string): Promise<OrderDB[]>;
    getById: (id: string | Types.ObjectId, populate?: boolean) => Promise<OrderDB | null>;
}

