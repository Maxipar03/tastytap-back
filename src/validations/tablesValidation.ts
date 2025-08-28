import Joi from 'joi';

export const validateUpdateTable= Joi.object({
    state: Joi.string().valid("available", "occupied", "reserved").optional(),
    waiterServing: Joi.string().hex().length(24).allow(null).optional(),
});

export const validateTableObjectId = Joi.object({
    tableId: Joi.string().trim().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.base': 'El ID debe ser una cadena de texto.',
        'string.empty': 'El ID no puede estar vacío.',
        'string.pattern.base': 'El ID proporcionado no es un ObjectId válido.',
        'any.required': 'El ID es un campo requerido.'
    })
});