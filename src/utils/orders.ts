// helpers/orderHelpers.ts
import { Types } from "mongoose";
import { NotFoundError } from "./custom-error.js";
import { CreateOrderDto, CreateOrderBodyDto } from "../dto/order.dto.js";
import { OrderItem } from "../types/order.js";
import { QRTablePayload, QRToGoPayload, UserPayload } from "../types/express.js";

export type KdsStatus = "pending" | "preparing" | "ready" | "delivered";

// Preparacion de datos necesarios para crear una orden
export const prepareOrderData = ({
    body,
    tableData,
    user,
    toGoData,
}: {
    body: CreateOrderBodyDto;
    tableData?: QRTablePayload;
    user?: UserPayload;
    toGoData?: QRToGoPayload;
}): CreateOrderDto => {

    if (toGoData) {
        // Orden para llevar
        return {
            items: body.items,
            pricing: body.pricing,
            status: body.status,
            orderType: "togo" as const,
            restaurant: toGoData.restaurant.id,
            userName: user ? user.name : body.guestName,
            clientId: user ? new Types.ObjectId(user.id) : undefined,
            isPaid: false,
        };
    }

    if (!tableData) throw new NotFoundError("Datos de mesa no encontrados");

    // Orden en mesa
    return {
        items: body.items,
        pricing: body.pricing,
        status: body.status,
        orderType: "dine-in" as const,
        tableId: tableData.tableId,
        waiterId: tableData.waiterId,
        restaurant: tableData.restaurant.id,
        userName: user ? user.name : body.guestName,
        clientId: user ? new Types.ObjectId(user.id) : undefined,
        isPaid: false,
    };
};

// Estado de una orden para el KDS en base de sus items
export const getKdsStatusFromItems = (items: OrderItem[]): KdsStatus => {
    if (!items || items.length === 0) return "pending";

    const activeItems = items.filter(i => i.status !== "cancelled");
    if (activeItems.length === 0) return "pending";

    const statuses = activeItems.map(i => i.status);

    if (statuses.includes("preparing")) return "preparing";
    if (statuses.every(s => s === "ready")) return "ready";
    if (statuses.every(s => s === "pending")) return "pending";
    if (statuses.every(s => s === "delivered")) return "delivered";

    return "pending";
};