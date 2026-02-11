import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { OrderDB, OrderItem, OrderItemOption, OrderItemOptionValue, OrderPricing } from "../../../types/order.js"

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
        enum: ["awaiting_payment", "pending", "preparing", "ready", "delivered", "cancelled"],
        default: "pending",
    },
    deletionReason: {
        type: String,
        trim: true,
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
    tableId: {
        type: Schema.Types.ObjectId,
        ref: "table",
        required: false,
    },
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: "restaurant",
        required: true,
    },
    waiterId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: false,
    },
    orderType: {
        type: String,
        enum: ["dine-in", "togo"],
        default: "dine-in",
    },
    status: {
        type: String,
        enum: ["open", "awaiting_payment", "paid", "cancelled"],
        default: "open",
    },
    activeSession: {
        type: Schema.Types.ObjectId,
        ref: "tableSession",
        required: false,
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
    manual: {
        type: Boolean,
        default: false,
        trim: true,
    },
    pricing: {
        type: OrderPricingSchema,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "card"],
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    cancellationReason: {
        type: String,
        trim: true,
    },
    cancelledBy: {
        type: Schema.Types.ObjectId,
        ref: "user",
    },
}, {
    timestamps: true,
});

OrderSchema.plugin(mongoosePaginate);

export const OrderModel = model <OrderDB> ("order", OrderSchema);