import Joi from 'joi';
import { commonValidations } from './common.validation';

export const validateUpdateTable= Joi.object({
    state: Joi.string().valid("available", "occupied", "reserved").optional(),
    waiterServing: Joi.string().hex().length(24).allow(null).optional(),
});

export const validateTableObjectId = Joi.object({
    tableId: commonValidations.mongoIdRegex.required().messages({
        'any.required': 'El ID es un campo requerido.'
    })
});