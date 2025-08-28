import { connect } from "mongoose";
import config from "./config.js";

export const initMongoDB = async (): Promise<void> => {
    try {
        await connect(config.MONGODB_URI as string);
        console.log("Conexión a MongoDB establecida correctamente");
    } catch (error) {
        const err = error as Error;
        console.error("Error al conectar a MongoDB:", err.message);
        throw new Error("Error al conectar a la base de datos");
    }
};