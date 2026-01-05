import Joi from 'joi';
import { commonValidations } from './common.validation';

export const validateCreateRestaurant = Joi.object({
    name: commonValidations.text(3, 100).required().messages({
        'any.required': 'El nombre es un campo requerido.'
    }),
    address: commonValidations.text(5, 255).required().messages({
        'any.required': 'La dirección es un campo requerido.'
    }),
    phone: commonValidations.phone.optional(),
    email: commonValidations.email.optional(),
    description: commonValidations.text(1, 1000).required().messages({
        'any.required': 'La descripción es un campo requerido.'
    }),
    numberTables: Joi.number().integer().min(1).required().messages({
        'number.base': 'El número de mesas debe ser un número.',
        'number.integer': 'El número de mesas debe ser un entero.',
        'number.min': 'El número de mesas debe ser al menos {#limit}.',
        'any.required': 'El número de mesas es un campo requerido.'
    })
});

export const validateObjectId = Joi.object({
    id: commonValidations.mongoIdRegex.required().messages({
        'any.required': 'El ID es un campo requerido.'
    })
});

export const validateUpdateRestaurant = Joi.object({
    name: commonValidations.text(3, 100).optional(),
    address: commonValidations.text(5, 255).optional(),
    phone: commonValidations.phone.optional(),
    email: commonValidations.email.optional(),
    description: commonValidations.text(1, 1000).optional(),
    menu: Joi.array().items(commonValidations.mongoIdRegex).messages({
        'array.base': 'El menú debe ser un array de IDs.'
    }),
    numberTables: Joi.number().integer().min(1).messages({
        'number.base': 'El número de mesas debe ser un número.',
        'number.integer': 'El número de mesas debe ser un entero.',
        'number.min': 'El número de mesas debe ser al menos {#limit}.'
    })
});

