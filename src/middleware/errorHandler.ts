import { Request, Response, NextFunction } from 'express';
import { CustomError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/customError';
import { httpResponse } from '../utils/http-response';
import logger from '../utils/logger.js';
import { Sentry } from '../config/sentry.js';

export const errorHandler = (error: Error | CustomError, req: Request, res: Response, next: NextFunction) => {
    const requestInfo = {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
    };

    if (error instanceof ForbiddenError) {
        logger.warn({ ...requestInfo, error: error.message }, "Acceso prohibido");
        return httpResponse.Forbidden(res, error.message);
    } 
    
    if (error instanceof NotFoundError) {
        logger.warn({ ...requestInfo, error: error.message }, "Recurso no encontrado");
        return httpResponse.NotFound(res, error.message);
    } 
    
    if (error instanceof UnauthorizedError) {
        logger.warn({ ...requestInfo, error: error.message }, "No autorizado");
        return httpResponse.Unauthorized(res, error.message);
    } 
    
    if (error instanceof CustomError) {
        logger.warn({ ...requestInfo, error: error.message, status: error.status }, "Error del cliente");
        
        if (error.status >= 500) {
            Sentry.captureException(error);
        }
        
        return res.status(error.status).json({
            status: error.status,
            statusMsg: "Client Error",
            error: error.message
        });
    }

    // Error interno del servidor - siempre enviar a Sentry
    logger.error({ ...requestInfo, error: error.message, stack: error.stack }, "Error interno del servidor");
    Sentry.captureException(error);
    return httpResponse.ServerError(res, error, req.originalUrl);
};