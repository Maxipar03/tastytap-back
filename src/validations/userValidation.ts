import Joi from "joi";

const email = Joi.string().email().required().messages({
    'string.email': 'El correo electrónico debe ser una dirección de correo válida.',
    'string.empty': 'El correo electrónico no puede estar vacío.',
    'any.required': 'El correo electrónico es un campo requerido.'
});

const password = Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos {#limit} caracteres.',
    'string.empty': 'La contraseña no puede estar vacía.',
    'any.required': 'La contraseña es un campo requerido.'
});

const name = Joi.string().min(3).required().messages({
    'string.min': 'El nombre debe tener al menos {#limit} caracteres.',
    'string.empty': 'El nombre no puede estar vacío.',
    'any.required': 'El nombre es un campo requerido.'
});

const role = Joi.string().valid('user', 'waiter', 'chef', 'admin').default('user').messages({
    'any.only': 'El rol debe ser uno de los siguientes: user, waiter, chef, admin.'
});

export const registerUserSchema = Joi.object({
    name,
    email,
    password,
    phone: Joi.string().optional().allow(null, ''),
    profileImage: Joi.string().optional().allow(null, ''),
});

export const loginUserSchema = Joi.object({
    email,
    password
});

