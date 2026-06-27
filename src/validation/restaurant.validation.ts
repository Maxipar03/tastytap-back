import Joi from 'joi';
import { commonValidations } from './common.validation';

export const validateCreateRestaurant = Joi.object({
    name: commonValidations.text(3, 100).required().messages({
        'any.required': 'El nombre es un campo requerido.'
    }),
    address: commonValidations.text(5, 255).required().messages({
         'any.required': 'La dirección es un campo requerido.'
     }),
    phone: commonValidations.phone.required().messages({
        'any.required': 'El teléfono es un campo requerido.'
    }),
    type: commonValidations.text(3, 100).required().messages({
        'any.required': 'El tipo es un campo requerido.'
    }),
    lat: Joi.number().required().messages({
        'number.base': 'La latitud debe ser un número.',
        'any.required': 'La latitud es un campo requerido.'
    }),
    lng: Joi.number().required().messages({
        'number.base': 'La longitud debe ser un número.',
        'any.required': 'La longitud es un campo requerido.'
    }),
    termsAccepted: Joi.boolean().required().messages({
        'boolean.base': 'Debe aceptar los terminos y condiciones.',
        'any.required': 'Debe aceptar los terminos y condiciones.'
    }),
    description: commonValidations.text(1, 1000).required().messages({
        'any.required': 'La descripción es un campo requerido.'
    }),
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
    description: commonValidations.text(1, 1000).optional(),
    menu: Joi.array().items(commonValidations.mongoIdRegex).messages({
        'array.base': 'El menú debe ser un array de IDs.'
    }),
});

