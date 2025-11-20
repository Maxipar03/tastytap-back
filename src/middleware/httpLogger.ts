import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    // Capturar información de la request
    const requestInfo = {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
        contentLength: req.get('Content-Length')
    };

    // Log de request entrante
    logger.info(requestInfo, 'HTTP Request');

    // Interceptar el final de la response
    const originalSend = res.send;
    res.send = function(body) {
        const duration = Date.now() - start;
        
        const responseInfo = {
            ...requestInfo,
            statusCode: res.statusCode,
            duration,
            responseSize: body ? Buffer.byteLength(body, 'utf8') : 0
        };

        // Log basado en el status code
        if (res.statusCode >= 500) {
            logger.error(responseInfo, 'HTTP Response - Server Error');
        } else if (res.statusCode >= 400) {
            logger.warn(responseInfo, 'HTTP Response - Client Error');
        } else {
            logger.info(responseInfo, 'HTTP Response - Success');
        }

        return originalSend.call(this, body);
    };

    next();
};