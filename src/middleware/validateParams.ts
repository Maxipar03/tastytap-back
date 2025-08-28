import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Middleware genérico para validar los parámetros de la URL
export const validateParams = (schema: Joi.Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.params);
        if (error) {
            return res.status(400).json({
                message: error?.details?.[0]?.message,
            });
        }
        next();
    };
};