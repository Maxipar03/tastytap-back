import Joi from 'joi';
import { Types } from 'mongoose';

const objectIdValidator = (value: any, helpers: any) => {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

const foodOptionValueSchema = Joi.object({
    label: Joi.string().required(),
    price: Joi.number().required(),
});

const foodOptionSchema = Joi.object({
    type: Joi.string().valid('radio', 'checkbox').required(),
    name: Joi.string().required(),
    values: Joi.array().items(foodOptionValueSchema).required(),
});

export const validateMenuFilters = Joi.object({
    category: Joi.string().trim().optional(),
    minPrice: Joi.number().optional(),
    maxPrice: Joi.number().positive().optional().greater(Joi.ref('minPrice')).messages({
        'number.greater': 'El precio máximo debe ser mayor que el precio mínimo.'
    }),
    search: Joi.string().trim().optional(),
    available: Joi.boolean().optional(),
    isVegetarian: Joi.boolean().optional(),
    isVegan: Joi.boolean().optional(),
    isGlutenFree: Joi.boolean().optional(),
});

export const validateCreateFood = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().positive().required(),
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    options: Joi.array().items(foodOptionSchema).optional(),
    available: Joi.boolean().required(),
    stock: Joi.number().integer().min(0).required(),
    ingredients: Joi.array().items(Joi.string()).required(),
    isVegetarian: Joi.boolean().required(),
    isVegan: Joi.boolean().required(),
    isGlutenFree: Joi.boolean().required(),
    spicyLevel: Joi.number().integer().min(0).max(5).required(),
    image: Joi.string().optional(),
});

export const validateUpdateFood = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    options: Joi.array().items(foodOptionSchema).optional(),
    available: Joi.boolean().optional(),
    stock: Joi.number().integer().min(0).optional(),
    ingredients: Joi.array().items(Joi.string()).optional(),
    isVegetarian: Joi.boolean().optional(),
    isVegan: Joi.boolean().optional(),
    isGlutenFree: Joi.boolean().optional(),
    spicyLevel: Joi.number().integer().min(0).max(5).optional(),
    image: Joi.string().optional(),
});

export const validateParamsFoodId = Joi.object({
    id: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required()
        .messages({
            'string.base': 'Table ID must be a string',
            'string.empty': 'Table ID cannot be empty',
            'any.required': 'Table ID is required',
            'any.invalid': 'Table ID must be a valid ObjectId'
        })
});