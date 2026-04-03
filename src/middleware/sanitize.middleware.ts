import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'mongo-sanitize';

export const sanitizeData = (req: Request, res: Response, next: NextFunction): void => {
    
    // Sanitizar el body de la request
    if (req.body) req.body = mongoSanitize(req.body);
    
    // Sanitizar los query params
    if (req.query && Object.keys(req.query).length > 0) {
        Object.keys(req.query).forEach(key => {
            (req.query as any)[key] = mongoSanitize(req.query[key]);
        });
    }
    
    // Sanitizar los parámetros de la URL
    if (req.params && Object.keys(req.params).length > 0) {
        Object.keys(req.params).forEach(key => {
            if (req.params[key]) {
                req.params[key] = mongoSanitize(req.params[key]);
            }
        });
    }
    
    next();
};