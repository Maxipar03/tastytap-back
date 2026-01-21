import { Request, Response, NextFunction } from "express";
import { restaurantInvitationService } from "../service/restaurant-invitation.service.js";
import { restaurnatService } from "../service/restaurant.service.js";
import { httpResponse } from "../utils/http-response.js";
import { CustomError } from "../utils/custom-error.js";

class RestaurantInvitationController {
    sendInvitationAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email } = req.body;
            const result = await restaurantInvitationService.sendInvitation(email,"admin","create_restaurant");
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };

    sendInvitationEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log("Cuerpo del nopeo: ",req.body)
            const { email, role } = req.body;
            const restaurantId = req.user?.restaurant?.toString()

            const result = await restaurantInvitationService.sendInvitation(email, role, "restaurant_invite", restaurantId);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };

    validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { token } = req.params;
            console.log(token)
            if (!token) throw new CustomError("Token no proporcionado", 400)
            const result = await restaurantInvitationService.validateToken(token);
            httpResponse.Ok(res, result);
        } catch (error) {
            next(error);
        }
    };

    createRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { token } = req.params;
            const userId = req.user?.id;
            const userEmail = req.user?.email;

            if (!req.user) throw new CustomError("No se ha proporcionado el id del usuario", 400)  
            if (!userId) throw new CustomError("No se ha proporcionado el id del usuario", 400)  
            if (!userEmail) throw new CustomError("No se ha proporcionado el email del usuario", 400)  
            if (!token) throw new CustomError("No se ha proporcionado el id del token", 400)  

            const validation = await restaurantInvitationService.validateToken(token);
            
            if (req.user.email !== validation.email) throw new CustomError("El email no coincide con la invitación", 400);

            const restaurant = await restaurnatService.create({ ...req.body, logo: req.file }, userId, userEmail);
            
            await restaurantInvitationService.markAsUsed(token, restaurant._id.toString());

            httpResponse.Ok(res, restaurant);
        } catch (error) {
            next(error);
        }
    };
}

export const restaurantInvitationController = new RestaurantInvitationController();
