import Joi from 'joi';
import { commonValidations } from './common.validation';

const foodOptionValueSchema = Joi.object({
    label: Joi.string().required().messages({
        'any.required': 'La opción debe tener un nombre (label).',
        'string.base': 'El nombre de la opción debe ser un texto.',
        'string.empty': 'El nombre de la opción no puede estar vacío.'
    }),
    price: commonValidations.positiveNumber.required().messages({
        'any.required': 'La opción debe tener un precio.'
    }),
});

const foodOptionSchema = Joi.object({
    type: Joi.string().valid('radio', 'checkbox').required().messages({
        'any.required': 'El tipo de opción es obligatorio.',
        'any.only': 'El tipo de opción debe ser "radio" o "checkbox".'
    }),
    name: Joi.string().required().messages({
        'any.required': 'El nombre de la opción es obligatorio.',
        'string.base': 'El nombre de la opción debe ser un texto.',
        'string.empty': 'El nombre de la opción no puede estar vacío.'
    }),
    values: Joi.array().items(foodOptionValueSchema).required().messages({
        'any.required': 'La opción debe contener valores.',
        'array.base': 'Los valores de la opción deben ser un arreglo.'
    }),
    required: commonValidations.boolean.optional()
});

export const validateMenuFilters = Joi.object({
    category: Joi.string().trim().optional().messages({
        'string.base': 'La categoría debe ser un texto.'
    }),
    minPrice: Joi.number().optional().messages({
        'number.base': 'El precio mínimo debe ser un número.'
    }),
    maxPrice: commonValidations.positiveNumber.optional().greater(Joi.ref('minPrice')).messages({
        'number.greater': 'El precio máximo debe ser mayor que el precio mínimo.'
    }),
    search: Joi.string().trim().optional().messages({
        'string.base': 'El campo de búsqueda debe ser un texto.'
    }),
    available: commonValidations.boolean.optional(),
    isVegetarian: commonValidations.boolean.optional(),
    isVegan: commonValidations.boolean.optional(),
    isGlutenFree: commonValidations.boolean.optional(),
});

export const validateCreateFood = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'El nombre del alimento es obligatorio.',
        'string.base': 'El nombre del alimento debe ser un texto.',
        'string.empty': 'El nombre del alimento no puede estar vacío.'
    }),
    description: Joi.string().required().messages({
        'any.required': 'La descripción del alimento es obligatoria.',
        'string.base': 'La descripción debe ser un texto.',
        'string.empty': 'La descripción no puede estar vacía.'
    }),
    price: commonValidations.positiveNumber.required().messages({
        'any.required': 'El precio es obligatorio.'
    }),
    category: commonValidations.mongoIdRegex.required().messages({
        'any.required': 'La categoría es obligatoria.'
    }),
    options: Joi.array().items(foodOptionSchema).optional(),
    stock: commonValidations.nonNegativeInteger.required().messages({
        'any.required': 'El stock es obligatorio.'
    }),
    ingredients: Joi.array().items(Joi.string()).required().messages({
        'any.required': 'Debes ingresar al menos un ingrediente.',
        'array.base': 'Los ingredientes deben ser un arreglo de texto.'
    }),
    isVegetarian: commonValidations.boolean.required().messages({
        'any.required': 'El campo "vegetariano" es obligatorio.'
    }),
    isVegan: commonValidations.boolean.required().messages({
        'any.required': 'El campo "vegano" es obligatorio.'
    }),
    isGlutenFree: commonValidations.boolean.required().messages({
        'any.required': 'El campo "sin gluten" es obligatorio.'
    }),
    image: Joi.string().optional().messages({
        'string.base': 'La imagen debe ser una URL válida.'
    }),
});

export const validateUpdateFood = Joi.object({
    name: Joi.string().optional().messages({
        'string.base': 'El nombre del alimento debe ser un texto.'
    }),
    description: Joi.string().optional().messages({
        'string.base': 'La descripción debe ser un texto.'
    }),
    price: commonValidations.positiveNumber.optional(),
    category: commonValidations.mongoIdRegex.optional(),
    options: Joi.array().items(foodOptionSchema).optional(),
    available: commonValidations.boolean.optional(),
    stock: commonValidations.nonNegativeInteger.optional(),
    ingredients: Joi.array().items(Joi.string()).optional().messages({
        'array.base': 'Los ingredientes deben ser un arreglo de texto.'
    }),
    isVegetarian: commonValidations.boolean.optional(),
    isVegan: commonValidations.boolean.optional(),
    isGlutenFree: commonValidations.boolean.optional(),
    spicyLevel: Joi.number().integer().min(0).max(5).optional().messages({
        'number.base': 'El nivel de picante debe ser un número.',
        'number.integer': 'El nivel de picante debe ser un número entero.',
        'number.min': 'El nivel de picante no puede ser menor a 0.',
        'number.max': 'El nivel de picante no puede ser mayor a 5.'
    }),
    image: Joi.string().optional().messages({
        'string.base': 'La imagen debe ser una URL válida.'
    }),
});

export const validateParamsFoodId = Joi.object({
    id: commonValidations.mongoId.required().messages({
        'string.base': 'El ID de la comida debe ser un texto.',
        'string.empty': 'El ID de la comida no puede estar vacío.',
        'any.required': 'El ID de la comida es obligatorio.'
    })
});
