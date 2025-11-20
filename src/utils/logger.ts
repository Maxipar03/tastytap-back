import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

const logger = isDevelopment
    ? pino({
        level: process.env.LOG_LEVEL || "debug",
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
        level: process.env.LOG_LEVEL || "info",
        formatters: {
            level: (label) => ({ level: label })
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            pid: process.pid,
            hostname: process.env.HOSTNAME || "unknown",
            service: "tastytap-api",
            version: process.env.npm_package_version || "1.0.0"
        }
    });

export default logger;
