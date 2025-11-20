import { connect } from "mongoose";
import config from "./config.js";
import { NotFoundError } from "../utils/customError.js";
import logger from "../utils/logger.js";
import { createIndexes } from "./indexes.js";

export const initMongoDB = async (): Promise<void> => {
    try {
        const uri = config.MONGODB_URI as string;
        if(!uri) throw new NotFoundError("MONGODB_URI no esta configurado");
        
        logger.info("Iniciando conexion a MongoDB...");
        
        // Configuración del pool de conexiones
        await connect(uri, {
            maxPoolSize: 10, // Máximo 10 conexiones en el pool
            minPoolSize: 2,  // Mínimo 2 conexiones siempre activas
            maxIdleTimeMS: 30000, // Cerrar conexiones inactivas después de 30s
            serverSelectionTimeoutMS: 5000, // Timeout para seleccionar servidor
            socketTimeoutMS: 45000, // Timeout para operaciones de socket
            connectTimeoutMS: 10000, // Timeout para conectar
            bufferCommands: false // No buffer commands si no hay conexión
        });
        
        logger.info({ 
            uri: uri.replace(/\/\/.*@/, "//***:***@"),
            poolConfig: {
                maxPoolSize: 10,
                minPoolSize: 2,
                maxIdleTimeMS: 30000
            }
        }, "Conexion a MongoDB establecida correctamente con pool de conexiones");
        
        await createIndexes();
        logger.info("Índices de base de datos creados");
    } catch (error) {
        const err = error as Error;
        logger.error({ error: err.message, stack: err.stack }, "Error al conectar a MongoDB");
        throw new Error("Error al conectar a la base de datos");
    }
};