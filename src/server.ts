import express, { Express, json, urlencoded, Request, Response, NextFunction } from "express";
import { initSocketIO } from "./config/socket.js";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import config from "./config/config.js";
import { initMongoDB } from "./config/db.js";
import apiRouter from "./routes/index.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

// Importa las configuraciones de Passport aquí
import "./config/passport/googleStrategy.js";

// Carga las variables de entorno
dotenv.config();

// Definición de __dirname para CommonJS
const __dirname = path.dirname(__filename);

// Crea la instancia de la aplicación Express y tipala
const app: Express = express();

// Middlewares
app
    .use(json())
    .use(urlencoded({ extended: true }))
    .use(morgan("dev"))
    .use(cookieParser())
    .use('/public', express.static(path.join(__dirname, 'public')))
    .use(
        cors({
            credentials: true,
            origin: config.FRONT_ENDPOINT,
            methods: ["GET", "POST", "PUT", "DELETE"],
        })
    );

// Inicializa Passport
app.use(passport.initialize());

// Rutas
app.use("/api", apiRouter);

// Middleware de manejo de errores
app.use(errorHandler);

// Configuración del puerto
const port: number = Number(config.PORT) || 8080;

// Inicializa la conexión a la base de datos
initMongoDB()
    .then(() => console.log("Conectado a la base de datos"))
    .catch((error: Error) => console.log(error));

// Inicia el servidor HTTP
const httpServer = app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});

// Inicia Socket.IO
initSocketIO(httpServer);
