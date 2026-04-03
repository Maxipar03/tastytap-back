import { Request, Response, NextFunction } from "express";
import { invitationService } from "../service/invitation.service.js";
import { InvitationService } from "../types/invitation.types.js";
import { httpResponse } from "../utils/response.utils.js";
import { CustomError } from "../utils/custom-error.utils.js";

class InvitationController {
    private service: InvitationService;

    constructor(service: InvitationService) {
        this.service = service;
    }

    createInvitation = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { email, role } = req.body;
            const restaurantId = req.user?.restaurant?.toString()

            const result = await this.service.createInvitation(email, role, restaurantId);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };

    verifyInvitationToken = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { token } = req.params;
            if (!token) throw new CustomError("Token no proporcionado", 400)

            const result = await this.service.verifyInvitationToken(token);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };
}

export const invitationController = new InvitationController(invitationService);
