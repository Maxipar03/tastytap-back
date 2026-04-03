import Joi from "joi";

export const validateSendInvitation= Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().required()
});

export const validateTokenParam = Joi.object({
    token: Joi.string().required()
});

export const validateOnboardingRestaurant = Joi.object({
    token: Joi.string().required(),
    name: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().optional(),
    email: Joi.string().email().required(),
    description: Joi.string().required(),
    numberTables: Joi.number().integer().min(1).required()
});
