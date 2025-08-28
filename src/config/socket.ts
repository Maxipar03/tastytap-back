import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { ClientToServerEvents, SocketData } from "../types/socket.js";

// La variable 'io' ahora tiene los tipos correctos para los eventos
let io: Server<ClientToServerEvents, any, SocketData>;

export const initSocketIO = (httpServer: HttpServer) => {
  io = new Server<ClientToServerEvents, any, SocketData>(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST", "DELETE"],
      credentials: true
    }
  });

  io.on("connection", (socket: Socket<ClientToServerEvents, any, SocketData>) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("join-restaurant", (payload) => {

      console.log(payload)

      const { restaurant, role } = payload;
      
      if (role === "waiter" || role === "manager" || role === "chef") {
        socket.join(`restaurant-${restaurant}`);
        // Puedes guardar los datos en el objeto del socket para referencia futura
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

    socket.on("join-table", ({ tableId }) => {
      socket.join(`table-${tableId}`);
      socket.data.tableId = tableId;
      console.log(`Cliente unido a la mesa ${tableId}`);
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