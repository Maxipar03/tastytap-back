import { Request, Response, NextFunction } from "express";
import RestaurantInvitationService, { restaurantInvitationService } from "../service/restaurant-invitation.service.js";
import { httpResponse } from "../utils/http-response.js";
import { CustomError } from "../utils/custom-error.js";

class RestaurantInvitationController {
    private service: RestaurantInvitationService;

    constructor(service: RestaurantInvitationService) {
        this.service = service;
    }

    sendInvitationEmployee = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { email, role } = req.body;
            const restaurantId = req.user?.restaurant?.toString()

            const result = await this.service.sendInvitation(email, role, restaurantId);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };

    validateToken = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { token } = req.params;
            if (!token) throw new CustomError("Token no proporcionado", 400)

            const result = await this.service.validateToken(token);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };
}

export const restaurantInvitationController = new RestaurantInvitationController(restaurantInvitationService);
