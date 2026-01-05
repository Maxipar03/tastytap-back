import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { ClientToServerEvents, ServerToClientEvents, SocketData } from "../types/socket.js";

let io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

// Inicializa Socket.IO sobre el servidor HTTP existente.
export const initSocketIO = (httpServer: HttpServer) => {
  io = new Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>(httpServer, {
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

  // Listener principal de nuevas conexiones Socket y manejo de salas
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>) => {

    socket.on("join-restaurant", (payload) => {

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

    socket.on("join-order", ({ orderId }) => {
      socket.join(`order-${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });

  return io;
};

// Retorna la instancia inicializada de Socket.IO.
export const getIO = () => {
  if (!io) throw new Error("Socket.io no ha sido inicializado");
  return io;
};