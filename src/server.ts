import * as Sentry from "@sentry/node";
import { initSentry } from "./config/sentry.js";
import express, { Express, json, urlencoded, Request, Response, NextFunction } from "express";
import { initSocketIO } from "./config/socket.js";
import { initSocketListeners } from "./events/socket.listeners.js";
import path from "path";
import { errorHandler } from "./middleware/error-handler.js";
import config from "./config/config.js";
import { initMongoDB } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import apiRouter from "./routes/index.js";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import { httpLogger } from "./middleware/http-logger.js";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import { setupProcessLogging } from "./utils/process-logger.js";
import { rateLimitMiddleware } from "./middleware/rate-limiter.js";
import { compressionConfig } from "./config/compression.js";
import { mongoSanitizeMiddleware } from "./middleware/mongo-sanitize.js";
import { sentryContextMiddleware } from "./middleware/sentry-context.js";
import { setupAllAlerts } from "./utils/alerts-config.js";
import "./config/passport/google-strategy.js";
import { } from "rate-limiter-flexible";

initSentry();

// Carga las variables de entorno
dotenv.config();

// Configurar logging de procesos
setupProcessLogging();

// Configurar alertas de monitoreo
setupAllAlerts();

// Definición de __dirname para CommonJS
const __dirname = path.dirname(__filename);

// Crea la instancia de la aplicación Express y tipala
const app: Express = express();

// Configuración de Helmet para seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
            connectSrc: ["'self'", "http://localhost:8080", "https://accounts.google.com", "https://oauth2.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
            frameSrc: ["'self'", "https://accounts.google.com"]
        }
    },
    crossOriginEmbedderPolicy: false // Permite embeds de Google OAuth
}));

// Middlewares
app
    .use('/api/checkout/webhook', express.raw({
        type: 'application/json',
        limit: '1mb'
    }))
    .use(compressionConfig) // Compresión gzip optimizada
    .use(rateLimitMiddleware) // Rate limiting global
    .use(json())
    .use(urlencoded({ extended: true }))
    .use(mongoSanitizeMiddleware) // Sanitización MongoDB
    .use(sentryContextMiddleware) // Contexto de Sentry
    .use(httpLogger) // Loger HTTP
    .use(cookieParser()) // Cookies
    .use('/public', express.static(path.join(__dirname, 'public'))) // Ruta publica
    .use(
        cors({
            credentials: true,
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);

                const allowedOrigins = [
                    "https://tastytap.net",
                    "https://www.tastytap.net",
                    "https://tastytap-panel.vercel.app/",
                    "http://localhost:3000",
                    "http://localhost:3001",
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
    )
    .use(session({
        secret: process.env.SESSION_SECRET || 'your-secret-key-here',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        }
    }))
    .use(passport.initialize())
    .use(passport.session())
    .use("/api", apiRouter);

Sentry.setupExpressErrorHandler(app);

// Middleware de manejo de errores personalizado
app.use(errorHandler);

// Configuración del puerto
const port: number = Number(config.PORT) || 8080;

// Inicializa la conexión a la base de datos
initMongoDB()
    .then(() => logger.info("Conectado a la base de datos MongoDB"))
    .catch((error: Error) => {
        logger.error({ Error: error.message, Stack: error.stack }, "Error al conectar a la base de datos");
        process.exit(1);
    });

// Inicializa la conexión a Redis
connectRedis()
    .then(() => logger.info("Conectado a Redis"))
    .catch((error: Error) => logger.error({ Error: error.message }, "Error al conectar a Redis"));

// Inicia el servidor HTTP
const httpServer = app.listen(port, '0.0.0.0', () => {
    logger.info({ Port: port, Environment: process.env.NODE_ENV || 'development' }, "Servidor HTTP iniciado");
});

// Inicia Socket.IO
initSocketIO(httpServer);

// Inicia los listeners de eventos para Socket.IO
initSocketListeners();