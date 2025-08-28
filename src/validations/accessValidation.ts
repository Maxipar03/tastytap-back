import Joi from 'joi';
import { Types } from 'mongoose';

const objectIdValidator = (value: any, helpers: any) => {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

export const generateQRSchema = Joi.object({
    tableId: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required()
        .messages({
            'string.base': 'Table ID must be a string',
            'string.empty': 'Table ID cannot be empty',
            'any.required': 'Table ID is required',
            'any.invalid': 'Table ID must be a valid ObjectId'
        })
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