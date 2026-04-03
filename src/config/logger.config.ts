import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

// Congifuracion del logger
const logger = isDevelopment
    ? pino({
        level: "debug",
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname"
            }
        }
    })
    : pino({
        level: "info",
        formatters: {
            level: (label) => ({ level: label })
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            pid: process.pid,
            hostname: process.env.HOSTNAME || "unknown",
            service: "tastytap-api",
            version: "1.0.0"
        }
    });

export default logger;
