import Joi from 'joi';
import { Types } from 'mongoose';

const objectIdValidator = (value: any, helpers: any) => {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

const itemSchema = Joi.object({
    foodId: Joi.string().custom(objectIdValidator, 'ObjectId validation').required(),
    foodName: Joi.string().required(),
    options: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        values: Joi.array().items(Joi.object({
            label: Joi.string().required(),
            price: Joi.number().min(0).required(),
        })).min(1).required(),
    })).default([]),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().min(1).required(),
    notes: Joi.string().optional().allow(''),
    status: Joi.string().valid('pending', 'preparing', 'ready', 'delivered', 'cancelled').default('pending'),
});

const pricingSchema = Joi.object({
    subtotal: Joi.number().positive().required(),
    tax: Joi.number().min(0).required(),
    total: Joi.number().positive().required(),
});

export const createOrderSchema = Joi.object({
    items: Joi.array().items(itemSchema).min(1).required(),
    pricing: pricingSchema.required(),
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled').default('pending'),
}).unknown(true);

export const validateItemAndTableOrder = Joi.object({
    tableId: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required()
        .messages({
            'string.base': 'Table ID must be a string',
            'string.empty': 'Table ID cannot be empty',
            'any.required': 'Table ID is required',
            'any.invalid': 'Table ID must be a valid ObjectId'
        }),
    itemId: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required()
        .messages({
            'string.base': 'Item ID must be a string',
            'string.empty': 'Item ID cannot be empty',
            'any.required': 'Item ID is required',
            'any.invalid': 'Item ID must be a valid ObjectId'
        })
});

export const validateUpdateItemStatus = Joi.object({
    orderId: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required()
        .messages({
            'string.base': 'Item ID must be a string',
            'string.empty': 'Item ID cannot be empty',
            'any.required': 'Item ID is required',
            'any.invalid': 'Item ID must be a valid ObjectId'
        }),
    itemId: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required()
        .messages({
            'string.base': 'Order ID must be a string',
            'string.empty': 'Order ID cannot be empty',
            'any.required': 'Order ID is required',
            'any.invalid': 'Order ID must be a valid ObjectId'
        })
});

export const validateIdOrder = Joi.object({
    id: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required()
        .messages({
            'string.base': 'Table ID must be a string',
            'string.empty': 'Table ID cannot be empty',
            'any.required': 'Table ID is required',
            'any.invalid': 'Table ID must be a valid ObjectId'
        })
})