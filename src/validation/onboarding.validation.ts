import Joi from "joi";
import { commonValidations } from "./common.validation";

export const RestaurantRequestValidation = Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().optional(),
    termsAccepted: Joi.boolean().required(),
    estimatedTables: Joi.number().required(),
});

export const RestaurantRequestValidationUpdate = Joi.object({
    id: commonValidations.mongoId.required(),
})
