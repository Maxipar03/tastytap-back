import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.config.js';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Extraer metadatos de la petición
    const getContext = () => ({
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        contentLength: req.get('Content-Length'),
    });

    // Log de entrada 
    logger.debug(getContext(), `Incoming Request: ${req.method} ${req.originalUrl}`);

    // Escuchar el evento 'finish' (cuando la respuesta se ha enviado al cliente)
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { statusCode } = res;
        
        const logData = {
            ...getContext(),
            statusCode,
            duration: `${duration}ms`,
            responseSize: res.get('Content-Length') || 'unknown',
        };

        if (statusCode >= 500) {
            logger.error(logData, 'HTTP Response - Server Error');
        } else if (statusCode >= 400) {
            logger.warn(logData, 'HTTP Response - Client Error');
        } else {
            logger.info(logData, 'HTTP Response - Success');
        }
    });

    next();
};