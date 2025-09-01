import Joi from 'joi';
import { Types } from 'mongoose';

const objectIdValidator = (value: any, helpers: any) => {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

const foodOptionValueSchema = Joi.object({
    label: Joi.string().required().messages({
        'any.required': 'La opción debe tener un nombre (label).',
        'string.base': 'El nombre de la opción debe ser un texto.',
        'string.empty': 'El nombre de la opción no puede estar vacío.'
    }),
    price: Joi.number().required().messages({
        'any.required': 'La opción debe tener un precio.',
        'number.base': 'El precio de la opción debe ser un número.'
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
});

export const validateMenuFilters = Joi.object({
    category: Joi.string().trim().optional().messages({
        'string.base': 'La categoría debe ser un texto.'
    }),
    minPrice: Joi.number().optional().messages({
        'number.base': 'El precio mínimo debe ser un número.'
    }),
    maxPrice: Joi.number().positive().optional().greater(Joi.ref('minPrice')).messages({
        'number.base': 'El precio máximo debe ser un número.',
        'number.positive': 'El precio máximo debe ser mayor a 0.',
        'number.greater': 'El precio máximo debe ser mayor que el precio mínimo.'
    }),
    search: Joi.string().trim().optional().messages({
        'string.base': 'El campo de búsqueda debe ser un texto.'
    }),
    available: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "disponible" debe ser verdadero o falso.'
    }),
    isVegetarian: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "vegetariano" debe ser verdadero o falso.'
    }),
    isVegan: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "vegano" debe ser verdadero o falso.'
    }),
    isGlutenFree: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "sin gluten" debe ser verdadero o falso.'
    }),
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
    price: Joi.number().positive().required().messages({
        'any.required': 'El precio es obligatorio.',
        'number.base': 'El precio debe ser un número.',
        'number.positive': 'El precio debe ser mayor a 0.'
    }),
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
        'any.required': 'La categoría es obligatoria.',
        'string.pattern.base': 'La categoría debe ser un ObjectId válido.'
    }),
    options: Joi.array().items(foodOptionSchema).optional(),
    available: Joi.boolean().required().messages({
        'any.required': 'El campo "disponible" es obligatorio.',
        'boolean.base': 'El campo "disponible" debe ser verdadero o falso.'
    }),
    stock: Joi.number().integer().min(0).required().messages({
        'any.required': 'El stock es obligatorio.',
        'number.base': 'El stock debe ser un número.',
        'number.integer': 'El stock debe ser un número entero.',
        'number.min': 'El stock no puede ser negativo.'
    }),
    ingredients: Joi.array().items(Joi.string()).required().messages({
        'any.required': 'Debes ingresar al menos un ingrediente.',
        'array.base': 'Los ingredientes deben ser un arreglo de texto.'
    }),
    isVegetarian: Joi.boolean().required().messages({
        'any.required': 'El campo "vegetariano" es obligatorio.',
        'boolean.base': 'El campo "vegetariano" debe ser verdadero o falso.'
    }),
    isVegan: Joi.boolean().required().messages({
        'any.required': 'El campo "vegano" es obligatorio.',
        'boolean.base': 'El campo "vegano" debe ser verdadero o falso.'
    }),
    isGlutenFree: Joi.boolean().required().messages({
        'any.required': 'El campo "sin gluten" es obligatorio.',
        'boolean.base': 'El campo "sin gluten" debe ser verdadero o falso.'
    }),
    spicyLevel: Joi.number().integer().min(0).max(5).required().messages({
        'any.required': 'El nivel de picante es obligatorio.',
        'number.base': 'El nivel de picante debe ser un número.',
        'number.integer': 'El nivel de picante debe ser un número entero.',
        'number.min': 'El nivel de picante no puede ser menor a 0.',
        'number.max': 'El nivel de picante no puede ser mayor a 5.'
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
    price: Joi.number().positive().optional().messages({
        'number.base': 'El precio debe ser un número.',
        'number.positive': 'El precio debe ser mayor a 0.'
    }),
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
        'string.pattern.base': 'La categoría debe ser un ObjectId válido.'
    }),
    options: Joi.array().items(foodOptionSchema).optional(),
    available: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "disponible" debe ser verdadero o falso.'
    }),
    stock: Joi.number().integer().min(0).optional().messages({
        'number.base': 'El stock debe ser un número.',
        'number.integer': 'El stock debe ser un número entero.',
        'number.min': 'El stock no puede ser negativo.'
    }),
    ingredients: Joi.array().items(Joi.string()).optional().messages({
        'array.base': 'Los ingredientes deben ser un arreglo de texto.'
    }),
    isVegetarian: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "vegetariano" debe ser verdadero o falso.'
    }),
    isVegan: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "vegano" debe ser verdadero o falso.'
    }),
    isGlutenFree: Joi.boolean().optional().messages({
        'boolean.base': 'El campo "sin gluten" debe ser verdadero o falso.'
    }),
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
    id: Joi.string()
        .custom(objectIdValidator, 'ObjectId validation')
        .required()
        .messages({
            'string.base': 'El ID de la comida debe ser un texto.',
            'string.empty': 'El ID de la comida no puede estar vacío.',
            'any.required': 'El ID de la comida es obligatorio.',
            'any.invalid': 'El ID debe ser un ObjectId válido.'
        })
});
