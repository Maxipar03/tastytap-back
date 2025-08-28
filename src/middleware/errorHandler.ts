import { Request, Response, NextFunction } from 'express';
import { CustomError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/customError';
import { httpResponse } from '../utils/http-response'; // Asegúrate de que la ruta sea correcta

export const errorHandler = (error: Error | CustomError, req: Request, res: Response, next: NextFunction) => {

    if (error instanceof ForbiddenError) {
        return httpResponse.NotFound(res, error.message);
    } 
    
    if (error instanceof NotFoundError) {
        return httpResponse.NotFound(res, error.message);
    } 
    
    if (error instanceof UnauthorizedError) {
        return httpResponse.Unauthorized(res, error.message);
    } 
    
    if (error instanceof CustomError) {
        return res.status(error.status).json({
            status: error.status,
            statusMsg: "Client Error",
            error: error.message
        });
    }

    return httpResponse.ServerError(res, error, req.originalUrl);
};