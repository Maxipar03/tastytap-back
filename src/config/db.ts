import { connect } from "mongoose";
import config from "./config.js";
import { NotFoundError } from "../utils/customError.js";

export const initMongoDB = async (): Promise<void> => {
    try {
        const uri = config.MONGODB_URI as string;
        if(!uri) throw new NotFoundError("MONGODB_URI no está configurado");
        await connect(uri);
        console.log("Conexión a MongoDB establecida correctamente");
    } catch (error) {
        const err = error as Error;
        console.error("Error al conectar a MongoDB:", err.message);
        throw new Error("Error al conectar a la base de datos");
    }
};