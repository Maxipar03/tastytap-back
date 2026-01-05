import { EventEmitter } from "events";
import { OrderDB } from "../types/order.js";
import { Types } from "mongoose";

interface OrderCreatedPayload {
    orderId: Types.ObjectId;
    order: OrderDB & { kdsStatus: string };
    kdsStatus: string;
    timestamp: Date;
    waiterId?: string | Types.ObjectId | undefined;
    restaurant: string | Types.ObjectId;
}

interface OrderUpdatedPayload {
    orderId: Types.ObjectId;
    newStatus: string;
    kdsStatus: string;
    order: OrderDB & { kdsStatus: string };
    timestamp: Date;
    restaurant: string | Types.ObjectId;
}

interface ItemUpdatedPayload {
    orderId: string;
    itemId: string;
    newStatus: string;
    kdsStatus: string;
    tableId?: Types.ObjectId;
    order: OrderDB & { kdsStatus: string };
    type: string;
    restaurant: Types.ObjectId;
}

interface ItemAddedPayload {
    order: OrderDB & { kdsStatus: string };
    kdsStatus: string;
    timestamp: Date;
    orderId: Types.ObjectId;
    restaurant: Types.ObjectId;
}

interface PayMethodSelectedPayload {
    orderId: Types.ObjectId;
    paymentMethod: string;
    restaurant: Types.ObjectId;
}

class OrderEventEmitter extends EventEmitter {
    emitOrderCreated(payload: OrderCreatedPayload) {
        this.emit("order:created", payload);
    }

    emitOrderUpdated(payload: OrderUpdatedPayload) {
        this.emit("order:updated", payload);
    }

    emitItemUpdated(payload: ItemUpdatedPayload) {
        this.emit("item:updated", payload);
    }

    emitItemAdded(payload: ItemAddedPayload) {
        this.emit("item:added", payload);
    }

    emitPayMethodSelected(payload: PayMethodSelectedPayload) {
        this.emit("paymethod:selected", payload);
    }
}

export const orderEvents = new OrderEventEmitter();
