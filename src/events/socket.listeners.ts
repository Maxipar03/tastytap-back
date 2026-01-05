import { getIO } from "../config/socket.js";
import { orderEvents } from "./order.events.js";
import { tableEvents } from "./table.events.js";
import { accessEvents } from "./access.events.js";

export const initSocketListeners = () => {
    orderEvents.on("order:created", (payload) => {
        const io = getIO();
        if (payload.waiterId) io.to(`waiter-${payload.waiterId}`).emit("order:created", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("order:created", payload);
        io.to(`order-${payload.orderId}`).emit("order:created", payload);
    });

    orderEvents.on("order:updated", (payload) => {
        const io = getIO();
        io.to(`order-${payload.orderId}`).emit("order:update", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("order:update", payload);
    });

    orderEvents.on("item:updated", (payload) => {
        const io = getIO();
        io.to(`order-${payload.orderId}`).emit("item:update", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("item:update", payload);
    });

    orderEvents.on("item:added", (payload) => {
        const io = getIO();
        io.to(`order-${payload.orderId}`).emit("item:add", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("item:add", payload);
    });

    orderEvents.on("paymethod:selected", (payload) => {
        const io = getIO();
        io.to(`order-${payload.orderId}`).emit("paymethod:selected", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("paymethod:selected", payload);
    });

    tableEvents.on("table:updated", (payload) => {
        const io = getIO();
        io.to(`restaurant-${payload.restaurant}`).emit("mesa-actualizada", payload.table);
    });

    accessEvents.on("qr:used", (payload) => {
        const io = getIO();
        io.to(`restaurant-${payload.restaurant}`).emit("QR-Used", true);
    });
};
