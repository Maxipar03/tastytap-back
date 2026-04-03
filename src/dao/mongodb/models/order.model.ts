import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { OrderDB, OrderItem, OrderItemOption, OrderItemOptionValue, OrderPricing } from "../../../types/order.types.js"

const OrderItemOptionValueSchema = new Schema<OrderItemOptionValue>({
    label: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        default: 0,
    },
});

const OrderItemOptionSchema = new Schema<OrderItemOption>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    values: [OrderItemOptionValueSchema],
});

const OrderItemSchema = new Schema<OrderItem>({
    foodId: {
        type: Schema.Types.ObjectId,
        ref: "food",
        required: true,
    },
    foodName: {
        type: String,
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
    options: [OrderItemOptionSchema],
    notes: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"],
        default: "PENDING",
    },
});

const OrderPricingSchema = new Schema<OrderPricing>({
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
});

const OrderSchema = new Schema<OrderDB>({
    items: {
        type: [OrderItemSchema],
        default: []
    },
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: "restaurant",
        required: true,
    },
    receipt: {
        type: Boolean,
        default: false
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: "user",
    },
    userName: {
        type: String,
        trim: true,
    },
    guestId: {
        type: String,
        trim: true,
    },
    pricing: {
        type: OrderPricingSchema,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["CASH", "CARD"],
    },
    paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
        default: "PENDING",
        index: true
    },
    paymentIntentId: {
        type: String,
        sparse: true
    },
    paymentSecret: {
        type: String,
        sparse: true
    },

}, {
    timestamps: true,
});

OrderSchema.plugin(mongoosePaginate);

export const OrderModel = model<OrderDB>("order", OrderSchema);