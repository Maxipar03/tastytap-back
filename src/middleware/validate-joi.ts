import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { BadRequestError } from '../utils/custom-error';

export const validateJoi = (schema: Joi.Schema, source: 'body' | 'params' | 'query') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req[source]);

        if (error) {
            const message = error.details.map(detail => detail.message).join(', ');
            return next(new BadRequestError(message));
        }
        next();
    };
};