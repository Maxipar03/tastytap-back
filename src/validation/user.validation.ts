import Joi from "joi";
import { commonValidations } from './common.validation';

const password = Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos {#limit} caracteres.',
    'string.empty': 'La contraseña no puede estar vacía.',
    'any.required': 'La contraseña es un campo requerido.'
});

const name = commonValidations.text(3).required().messages({
    'any.required': 'El nombre es un campo requerido.'
});

export const registerUserSchema = Joi.object({
    name,
    email: commonValidations.email.required(),
    password,
    phone: Joi.string().optional().allow(null, ''),
    profileImage: Joi.string().optional().allow(null, ''),
});

export const loginUserSchema = Joi.object({
    email: commonValidations.email.required(),
    password
});

