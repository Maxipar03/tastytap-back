import { getIO } from "../config/socket.config.js";
import { orderEvents } from "./order.events.js";

export const initSocketListeners = () => {
    orderEvents.on("order:created", (payload) => {
        const io = getIO();
        console.log("order:created", payload)
        io.to(`restaurant-${payload.restaurant}`).emit("order:created", payload);
        io.to(`guest-${payload.order.guestId}`).emit("order:created", payload);
    });

    orderEvents.on("order:updated", (payload) => {
        const io = getIO();
        io.to(`guest-${payload.order.guestId}`).emit("order:updated", payload);
        io.to(`order-${payload.order._id}`).emit("order:updated", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("order:updated", payload);
    });

    orderEvents.on("item:updated", (payload) => {
        const io = getIO();
        io.to(`guest-${payload.guestId}`).emit("item:update", payload);
        io.to(`restaurant-${payload.restaurant}`).emit("item:update", payload);
    });
};
