import { Schema, model } from "mongoose";
import { OrderDB, OrderItem, OrderItemOption, OrderPricing } from "../../../types/order.js"

const orderItemOptionSchema = new Schema < OrderItemOption > ({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    value: {
        type: Schema.Types.Mixed,
        required: true,
    },
});

const orderItemSchema = new Schema < OrderItem > ({
    food: {
        type: Schema.Types.ObjectId,
        ref: "food",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    options: [orderItemOptionSchema],
    notes: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["pending", "preparing", "ready", "delivered", "cancelled"],
        default: "pending",
    },
});

const orderPricingSchema = new Schema < OrderPricing > ({
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
});

const orderSchema = new Schema < OrderDB > ({
    items: { 
        type: [orderItemSchema], 
        default: [] 
    },
    tableId: {
        type: Schema.Types.ObjectId,
        ref: "table",
        required: true,
    },
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: "restaurant",
        required: true,
    },
    seatId: {
        type: Schema.Types.ObjectId,
        ref: "seat",
    },
    waiterId: {
        type: Schema.Types.ObjectId,
        ref: "user",
    },
    status: {
        type: String,
        enum: ["pending", "preparing", "ready", "delivered", "cancelled"],
        default: "pending",
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: "user",
    },
    userName: {
        type: String,
        trim: true,
    },
    pricing: {
        type: orderPricingSchema,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "card", "mobile"],
        default: "cash",
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

export const OrderModel = model < OrderDB > ("order", orderSchema);