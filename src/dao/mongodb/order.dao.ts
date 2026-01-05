import MongoDao from "./mongo.dao.js";
import { OrderModel } from "./models/order.model.js";
import { OrderDB } from "../../types/order.js";
import { CreateOrderDto } from "../../dto/order.dto.js";
import { BadRequestError } from "../../utils/custom-error.js";
import { Model, Types } from "mongoose";
import * as Sentry from "@sentry/node";

class OrderMongoDao extends MongoDao<OrderDB, CreateOrderDto> {
    constructor(model: Model<OrderDB>) {
        super(model);
    }

    getByIdWithPopulate = async (id: string | Types.ObjectId): Promise<OrderDB | null> => {
        
        return (await this.model.findById(id)
            .populate("clientId", "name profileImage")
            .populate("waiterId", "name profileImage")
            .populate("tableId", "tableNumber status")
            .lean()) as OrderDB | null;
    };

    getByUserId = async (userId: string | Types.ObjectId): Promise<OrderDB[]> => {
        if (!Types.ObjectId.isValid(userId)) throw new BadRequestError("ID inválido");
        return (await this.model.find({ clientId: userId }).lean()) as OrderDB[];
    };

    updateStatusItems = async (orderId: string | Types.ObjectId, itemId: string | Types.ObjectId, newStatus: string, deletionReason?: string): Promise<OrderDB | null> => {

        Sentry.addBreadcrumb({
            category: 'order',
            message: 'Order item status update',
            data: { orderId: orderId.toString(), itemId: itemId.toString(), newStatus, deletionReason }
        });

        const updateFields: any = { "items.$.status": newStatus, updatedAt: new Date() };
        if (newStatus === "cancelled" && deletionReason) updateFields["items.$.deletionReason"] = deletionReason;

        const updatedOrder = await this.model.findOneAndUpdate(
            { _id: orderId, "items._id": itemId },
            { $set: updateFields },
            { new: true }
        );

        return updatedOrder as OrderDB | null;
    };

    addItemsToOrder = async (orderId: string | Types.ObjectId, items: any[], session?: any): Promise<OrderDB | null> => {

        Sentry.addBreadcrumb({
            category: 'order',
            message: 'Adding items to order and recalculating pricing',
            data: { orderId: orderId.toString(), itemsCount: items.length }
        });

        const options = session ? { new: true, session } : { new: true };

        const orderWithNewItems = await this.model.findByIdAndUpdate(
            orderId,
            { $push: { items: { $each: items } }, updatedAt: new Date() },
            options
        );

        if (!orderWithNewItems) return null;

        const subtotal = orderWithNewItems.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08;
        const total = subtotal + tax;

        const updatedOrder = await this.model.findByIdAndUpdate(
            orderId,
            { 'pricing.subtotal': subtotal, 'pricing.tax': tax, 'pricing.total': total, updatedAt: new Date() },
            { ...options, populate: [{ path: "waiterId", select: "name email role" }, { path: "tableId", select: "tableNumber status" }] }
        );

        return updatedOrder as OrderDB | null;
    };
}

export const orderMongoDao = new OrderMongoDao(OrderModel);
