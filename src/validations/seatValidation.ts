import Joi from 'joi';
import { Types } from 'mongoose';

const objectIdValidator = (value: any, helpers: any) => {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

export const validateCreateSeat = Joi.object({
    guestName: Joi.string().trim().min(3).max(50).optional()
});

export const validateDeleteSeat = Joi.object({
    seatId: Joi.string()
        .required()
        .custom(objectIdValidator, 'ObjectId validation')
        .messages({
            'any.invalid': 'El ID del asiento proporcionado no es un ObjectId válido',
            'string.empty': 'El ID del asiento es requerido',
            'any.required': 'El ID del asiento es requerido'
        }),
});

export const validateGetByTableIdAdmin = Joi.object({
    tableId:  Joi.string()
        .required()
        .custom(objectIdValidator, 'ObjectId validation')
        .messages({
            'any.invalid': 'El ID del asiento proporcionado no es un ObjectId válido',
            'string.empty': 'El ID del asiento es requerido',
            'any.required': 'El ID del asiento es requerido'
        }),
});