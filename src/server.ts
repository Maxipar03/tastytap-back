import express, { Express, json, urlencoded, Request, Response, NextFunction } from "express";
import { initSocketIO } from "./config/socket.js";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import config from "./config/config.js";
import { initMongoDB } from "./config/db.js";
import apiRouter from "./routes/index.js";
import passport from "passport";
import session from "express-session";
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

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self' https://accounts.google.com https://apis.google.com; " +
        "connect-src 'self' http://localhost:8080 https://accounts.google.com https://oauth2.googleapis.com; " +
        "img-src 'self' data: https://*.googleusercontent.com; " +
        "frame-src 'self' https://accounts.google.com;"
    );
    next();
});


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
        })
    );

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Inicializa Passport
app.use(passport.initialize());
app.use(passport.session());

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
