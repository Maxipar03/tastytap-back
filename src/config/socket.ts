import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { ClientToServerEvents, SocketData } from "../types/socket.js";

// La variable 'io' ahora tiene los tipos correctos para los eventos
let io: Server<ClientToServerEvents, any, SocketData>;

export const initSocketIO = (httpServer: HttpServer) => {
  io = new Server<ClientToServerEvents, any, SocketData>(httpServer, {
    cors: {
            credentials: true,
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);

                const allowedOrigins = [
                    "https://tastytap.net",
                    "https://www.tastytap.net",
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "https://localhost:3000",
                    "https://localhost:5173"
                ];

                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }

                return callback(new Error('Not allowed by CORS'));
            },
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ['Content-Type', 'Authorization'],
            exposedHeaders: ['Set-Cookie']
        }
  });

  io.on("connection", (socket: Socket<ClientToServerEvents, any, SocketData>) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("join-restaurant", (payload) => {

      console.log(payload)

      const { restaurant, role } = payload;
      
      if (role === "waiter" || role === "manager" || role === "chef") {
        socket.join(`restaurant-${restaurant}`);
        socket.data.restaurant = restaurant;
        socket.data.role = role;
        console.log(`${role} unido al restaurante ${restaurant}`);
      }
    });

    socket.on("join-waiter", ({ waiterId }) => {
      socket.join(`waiter-${waiterId}`);
      socket.data.waiterId = waiterId;
      console.log(`Mozo ${waiterId} unido a su sala personal`);
    });

    // Nuevo: Unirse a notificaciones de una orden específica
    socket.on("join-order", ({ orderId }) => {
      socket.join(`order-${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io no ha sido inicializado");
  }

  const originalEmit = io.emit;
  io.emit = function (event, ...args: any[]) {
    console.log(`[Socket.io] Emitiendo evento: ${String(event)}`, JSON.stringify(args));
    return originalEmit.apply(this, [event, ...args]);
  };

  return io;
};