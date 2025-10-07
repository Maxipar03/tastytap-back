import Joi from "joi";
import { Types } from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
    if (!Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
}, 'ObjectId validation');

export const createCategorySchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
});

export const updateCategorySchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
});

export const updateCategoryParamsSchema = Joi.object({
    id: objectId.required(),
});

export const deleteCategorySchema = Joi.object({
    id: objectId.required(),
});