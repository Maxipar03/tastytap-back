import { NextFunction, Request, Response } from "express";
import { userValidationServices } from "../service/user-validations.service";
import { BadRequestError } from "../utils/custom-error";
import { UserValidationService } from "../types/user-validations";
import { httpResponse } from "../utils/http-response";

class UserValidationController {

    private service: UserValidationService

    constructor(services: UserValidationService) {
        this.service = services;
    }

    createUserValidation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id
            if (!userId) throw new BadRequestError("No se encuentra el email")
            const userValidation = await this.service.CreateUserValidation(userId)
            httpResponse.Ok(res, userValidation);
        } catch (error) {
            next(error)
        }
    }

    validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) throw new BadRequestError("No se encuentra el token");
            const result = await this.service.validateToken(id);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error)
        }
    }
}

export const userValidationController = new UserValidationController(userValidationServices);
