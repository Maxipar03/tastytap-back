import Joi from 'joi';
import { commonValidations } from './common.validation';

export const generateQRSchema = Joi.object({
    tableId: commonValidations.mongoId.required()
});

export const validateTokenSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'string.base': 'Token must be a string',
            'string.empty': 'Token cannot be empty',
            'any.required': 'Token is required',
        })
});