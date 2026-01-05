import Joi from 'joi';
import { commonValidations } from './common.validation';

const itemSchema = Joi.object({
    foodId: commonValidations.mongoId.required(),
    foodName: Joi.string().required(),
    options: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        values: Joi.array().items(Joi.object({
            label: Joi.string().required(),
            price: Joi.number().min(0).required(),
        })).min(1).required(),
    })).default([]),
    price: commonValidations.positiveNumber.required(),
    quantity: Joi.number().integer().min(1).required(),
    notes: Joi.string().optional().allow(''),
    status: Joi.string().valid('pending', 'preparing', 'ready', 'delivered', 'cancelled', 'awaiting_payment').default('pending'),
});

const pricingSchema = Joi.object({
    subtotal: commonValidations.positiveNumber.required(),
    tax: Joi.number().min(0).required(),
    total: commonValidations.positiveNumber.required(),
});

export const createOrderSchema = Joi.object({
    items: Joi.array().items(itemSchema).min(1).required(),
    pricing: pricingSchema.required(),
    status: Joi.string().valid('open', 'awaiting_payment', 'paid', 'cancelled').default('open'),
    orderType: Joi.string().valid('dine-in', 'togo').default('dine-in'),
}).unknown(true);

export const validateItemAndTableOrder = Joi.object({
    tableId: commonValidations.mongoId.required(),
    itemId: commonValidations.mongoId.required()
});

export const validateUpdateItemStatus = Joi.object({
    orderId: commonValidations.mongoId.required(),
    itemId: commonValidations.mongoId.required()
});

export const validateIdOrder = Joi.object({
    id: commonValidations.mongoId.required()
})

export const validateDeleteItem = Joi.object({
    deletionReason: commonValidations.text(3, 200).required()
})

export const validateUpdateOrderStatus = Joi.object({
    status: Joi.string()
        .valid('open', 'paid', 'cancelled')
        .required()
        .messages({
            'string.base': 'El estado debe ser texto',
            'any.only': 'Estado inválido',
            'any.required': 'El estado es obligatorio'
        }),
    deletionReason: Joi.when('status', {
        is: 'cancelled',
        then: commonValidations.text(3, 200).required().messages({
            'any.required': 'El motivo de cancelación es obligatorio cuando se cancela una orden'
        }),
        otherwise: Joi.optional()
    })
})