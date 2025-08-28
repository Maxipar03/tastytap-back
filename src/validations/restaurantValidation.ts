import Joi from 'joi';

export const validateCreateRestaurant = Joi.object({
    name: Joi.string().trim().required().min(3).max(100).messages({
        'string.base': 'El nombre debe ser una cadena de texto.',
        'string.empty': 'El nombre no puede estar vacío.',
        'string.min': 'El nombre debe tener al menos {#limit} caracteres.',
        'string.max': 'El nombre no puede tener más de {#limit} caracteres.',
        'any.required': 'El nombre es un campo requerido.'
    }),
    address: Joi.string().trim().required().min(5).max(255).messages({
        'string.base': 'La dirección debe ser una cadena de texto.',
        'string.empty': 'La dirección no puede estar vacía.',
        'string.min': 'La dirección debe tener al menos {#limit} caracteres.',
        'string.max': 'La dirección no puede tener más de {#limit} caracteres.',
        'any.required': 'La dirección es un campo requerido.'
    }),
    phone: Joi.string().trim().pattern(/^[0-9+() -]{7,20}$/).messages({
        'string.base': 'El teléfono debe ser una cadena de texto.',
        'string.pattern.base': 'El formato del teléfono no es válido.'
    }),
    email: Joi.string().email().messages({
        'string.base': 'El email debe ser una cadena de texto.',
        'string.email': 'El formato del email no es válido.'
    }),
    description: Joi.string().trim().required().max(1000).messages({
        'string.base': 'La descripción debe ser una cadena de texto.',
        'string.empty': 'La descripción no puede estar vacía.',
        'string.max': 'La descripción no puede tener más de {#limit} caracteres.',
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
    id: Joi.string().trim().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.base': 'El ID debe ser una cadena de texto.',
        'string.empty': 'El ID no puede estar vacío.',
        'string.pattern.base': 'El ID proporcionado no es un ObjectId válido.',
        'any.required': 'El ID es un campo requerido.'
    })
});

export const validateUpdateRestaurant = Joi.object({
    name: Joi.string().trim().min(3).max(100).messages({
        'string.base': 'El nombre debe ser una cadena de texto.',
        'string.empty': 'El nombre no puede estar vacío.',
        'string.min': 'El nombre debe tener al menos {#limit} caracteres.',
        'string.max': 'El nombre no puede tener más de {#limit} caracteres.'
    }),
    address: Joi.string().trim().min(5).max(255).messages({
        'string.base': 'La dirección debe ser una cadena de texto.',
        'string.empty': 'La dirección no puede estar vacía.',
        'string.min': 'La dirección debe tener al menos {#limit} caracteres.',
        'string.max': 'La dirección no puede tener más de {#limit} caracteres.'
    }),
    phone: Joi.string().trim().pattern(/^[0-9+() -]{7,20}$/).messages({
        'string.base': 'El teléfono debe ser una cadena de texto.',
        'string.pattern.base': 'El formato del teléfono no es válido.'
    }),
    email: Joi.string().email().messages({
        'string.base': 'El email debe ser una cadena de texto.',
        'string.email': 'El formato del email no es válido.'
    }),
    description: Joi.string().trim().max(1000).messages({
        'string.base': 'La descripción debe ser una cadena de texto.',
        'string.empty': 'La descripción no puede estar vacía.',
        'string.max': 'La descripción no puede tener más de {#limit} caracteres.'
    }),
    menu: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).messages({
        'array.base': 'El menú debe ser un array de IDs.',
        'string.pattern.base': 'El ID del menú no tiene un formato válido (ObjectId).'
    }),
    numberTables: Joi.number().integer().min(1).messages({
        'number.base': 'El número de mesas debe ser un número.',
        'number.integer': 'El número de mesas debe ser un entero.',
        'number.min': 'El número de mesas debe ser al menos {#limit}.'
    })
});

