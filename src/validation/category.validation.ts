import Joi from "joi";
import { commonValidations } from './common.validation';

export const createCategorySchema = Joi.object({
    name: commonValidations.text(3, 50).required(),
});

export const updateCategorySchema = Joi.object({
    name: commonValidations.text(3, 50).required(),
});

export const updateCategoryParamsSchema = Joi.object({
    id: commonValidations.mongoId.required(),
});

export const deleteCategorySchema = Joi.object({
    id: commonValidations.mongoId.required(),
});