import { getIO } from "../config/socket.config.js";
import { orderEvents } from "./order.events.js";

export const initSocketListeners = () => {
    orderEvents.on("order:created", (payload) => {
        const io = getIO();
        if (payload.waiterId) io.to(`waiter-${payload.waiterId}`).emit("order:created", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("order:created", payload);
        io.to(`guest-${payload.guestId}`).emit("order:created", payload);
    });

    orderEvents.on("order:updated", (payload) => {
        const io = getIO();
        io.to(`guest-${payload.guestId}`).emit("order:update", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("order:update", payload);
    });

    orderEvents.on("item:updated", (payload) => {
        const io = getIO();
        io.to(`guest-${payload.guestId}`).emit("item:update", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("item:update", payload);
    });
};
