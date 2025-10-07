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
    waiter?: string | Types.ObjectId;
    currentWaiterId?: string | Types.ObjectId;
    search?: string;
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
    foodId: Types.ObjectId;
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

export interface OrderDao {
    create: (body: CreateOrderDto) => Promise<OrderDB>;
    update: (id: string | Types.ObjectId, body: Partial<OrderDB>) => Promise<OrderDB | null>;
    updateStatusItems: (itemId: string | Types.ObjectId, orderId: string | Types.ObjectId, status: OrderStatus) => Promise<OrderDB | null>;
    addItemsToOrder: (orderId: string | Types.ObjectId, items: OrderItem[]) => Promise<OrderDB | null>;
    getByRestaurantId: (restaurant: string | Types.ObjectId, filters: OrderFilters) => Promise<OrderDB[]>;
    getById: (id: string | Types.ObjectId) => Promise<OrderDB | null>;
    getByUserId: (userId: string | Types.ObjectId) => Promise<OrderDB[]>;
    getByTableId: (tableId: string | Types.ObjectId) => Promise<OrderDB[]>;
}

export interface CreateOrderResponse {
    order: OrderDB;
    token: string;
}

export interface OrderService {
    create(orderData: CreateOrderDto): Promise<CreateOrderResponse>;
    updateStatusOrder(id: string | Types.ObjectId, orderData: Partial<OrderDB>, restaurant: string | Types.ObjectId): Promise<OrderDB | null>;
    updateStatusItems(itemId: string | Types.ObjectId, orderId: string | Types.ObjectId, status: OrderStatus): Promise<OrderDB | null>;
    addItemsToOrder(orderId: string | Types.ObjectId, items: OrderItem[]): Promise<OrderDB | null>;
    getByRestaurantId(restaurant: string | Types.ObjectId, filters: OrderFilters): Promise<OrderDB[]>;
    getById: (id: string | Types.ObjectId) => Promise<OrderDB | null>;
    getByUserId(userId: string | Types.ObjectId): Promise<OrderDB[]>;
    getByTableId(tableId: string | Types.ObjectId): Promise<OrderDB[]>;
}

