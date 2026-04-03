import { Request, Response, NextFunction } from "express";
import { httpResponse } from "../utils/response.utils.js";
import { BadRequestError } from "../utils/custom-error.utils.js";
import { onboardingServices } from "../service/onboarding.service.js";
import { OnboardingServices } from "../types/onboarding.types.js";

class OnboardingController {

    private service: OnboardingServices;

    constructor(service: OnboardingServices) {
        this.service = service;
    }

    createOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            if (!req.user) throw new BadRequestError("No se pudo obtener el usuario")
            const { isValidateMail, id } = req.user

            if (!isValidateMail) throw new BadRequestError("Debes validar tu email antes")

            const result = await this.service.createOnboarding(id, req.body);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };

    approveOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { id } = req.params;
            if (!id) throw new BadRequestError("Error en el envio de datos");
            const result = await this.service.approveOnboarding(id);

            httpResponse.Ok(res, { message: "Solicitud aprobada", data: result });
        } catch (error) { next(error); }
    };

    rejectOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { id } = req.params;
            if (!id) throw new BadRequestError("Error en el envio de datos")
            const result = await this.service.rejectOnboarding(id);
    
            httpResponse.Ok(res, { message: "Solicitud rechazada", data: result });
        } catch (error) { next(error); }
    };
}

export const onboardingController = new OnboardingController(onboardingServices);
