import { EventEmitter } from "events";
import { OrderDB } from "../types/order.types.js";
import { Types } from "mongoose";

interface OrderCreatedPayload {
    orderId: Types.ObjectId;
    order: OrderDB ;
    timestamp: Date;
    restaurant: string | Types.ObjectId;
}

interface OrderUpdatedPayload {
    orderId: Types.ObjectId;
    newStatus: string;
    order: OrderDB ;
    timestamp: Date;
    restaurant: string | Types.ObjectId;
}

interface ItemUpdatedPayload {
    orderId: string;
    itemId: string;
    newStatus: string;
    order: OrderDB ;
    type: string;
    restaurant: Types.ObjectId;
}

class OrderEventEmitter extends EventEmitter {
    emitOrderCreated(payload: OrderCreatedPayload) {
        this.emit("order:created", payload);
    }

    emitOrderUpdated(payload: OrderUpdatedPayload) {
        console.log(payload)
        this.emit("order:updated", payload);
    }

    emitItemUpdated(payload: ItemUpdatedPayload) {
        this.emit("item:updated", payload);
    }
}

export const orderEvents = new OrderEventEmitter();
