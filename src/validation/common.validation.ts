import Joi from 'joi';
import { Types } from 'mongoose';

const objectIdValidator = (value: any, helpers: any) => {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

export const commonValidations = {
    mongoId: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .messages({
            'string.base': 'El ID debe ser un texto',
            'string.empty': 'El ID no puede estar vacío',
            'any.required': 'El ID es obligatorio',
            'any.invalid': 'El ID debe ser un ObjectId válido'
        }),

    mongoIdRegex: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'El ID debe ser un ObjectId válido'
        }),

    email: Joi.string()
        .email()
        .messages({
            'string.email': 'El correo electrónico debe ser válido',
            'string.empty': 'El correo electrónico no puede estar vacío',
            'any.required': 'El correo electrónico es obligatorio'
        }),

    phone: Joi.string()
        .pattern(/^[0-9+() -]{7,20}$/)
        .messages({
            'string.pattern.base': 'El formato del teléfono no es válido'
        }),

    boolean: Joi.boolean().messages({
        'boolean.base': 'El campo debe ser verdadero o falso'
    }),

    positiveNumber: Joi.number()
        .positive()
        .messages({
            'number.base': 'Debe ser un número',
            'number.positive': 'Debe ser mayor a 0'
        }),

    nonNegativeInteger: Joi.number()
        .integer()
        .min(0)
        .messages({
            'number.base': 'Debe ser un número',
            'number.integer': 'Debe ser un número entero',
            'number.min': 'No puede ser negativo'
        }),

    text: (min: number = 3, max: number = 255) => Joi.string()
        .trim()
        .min(min)
        .max(max)
        .messages({
            'string.base': 'Debe ser texto',
            'string.empty': 'No puede estar vacío',
            'string.min': `Debe tener al menos ${min} caracteres`,
            'string.max': `No puede exceder ${max} caracteres`
        })
};
