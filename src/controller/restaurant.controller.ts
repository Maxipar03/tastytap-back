import { restaurnatService } from "../service/restaurant.service.js";
import { staffService } from "../service/staff.service.js";
import { OpeningHour, RestaurantDB, RestaurantService } from "../types/restaurant.types.js";
import { NextFunction, Request, Response } from "express";
import { httpResponse } from "../utils/response.utils.js";
import { NotFoundError, UnauthorizedError, BadRequestError } from "../utils/custom-error.utils.js";
import logger from "../config/logger.config.js";
import { CreateRestaurantDto } from "../dto/restaurant.dto.js";

class RestaurantController {

    private service: RestaurantService;

    constructor(services: RestaurantService) {
        this.service = services;
    }

    getById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const id = req.user?.restaurant;
            if (!id) throw new NotFoundError("Datos de restaurante no encontrados");

            const response = await this.service.getById(id.toString());
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    getByIdUser = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { restaurantId } = req.params;
            if (!restaurantId) throw new NotFoundError("Datos de restaurante no encontrados");

            const response = await this.service.getById(restaurantId.toString());
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    getNearbyRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { lat, lng, radius, name } = req.query;

            const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

            const restaurants = await this.service.discoverRestaurants({
                lat: lat ? Number(lat) : undefined,
                lng: lng ? Number(lng) : undefined,
                radius: radius ? Number(radius) : 5000,
                name: name as string,
                ip: clientIp,
            });

            return httpResponse.Ok(res, restaurants)
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const id = req.user?.restaurant?.toString();
            if (!id) throw new NotFoundError("Datos de restaurante no encontrados")

            logger.info({ restaurantId: id, userId: req.user?.id }, "Actualizando restaurante");

            const body = req.body;
            const parsedOpeningHours = body.openingHours && body.openingHours !== "undefined"
                ? JSON.parse(body.openingHours) as OpeningHour[]
                : [];

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            const updateData: any = {
                description: body.description,
                phone: body.phone,
                openingHours: parsedOpeningHours,
                logoFile: files?.logo ? files.logo[0] : undefined, // El archivo va aparte
                coverFile: files?.coverImage ? files.coverImage[0] : undefined
            };

            const response = await this.service.update(id, updateData);

            logger.info({ restaurantId: id, name: response?.name }, "Restaurante actualizado exitosamente");
            return httpResponse.Ok(res, response)
        } catch (error) {
            logger.error({ restaurantId: req.params.id, error: error }, "Error al actualizar restaurante");
            next(error);
        }
    };

    createOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const restaurantId = req.user?.restaurant;
            if (!restaurantId) throw new UnauthorizedError("Restaurante no encontrado");

            const response = await this.service.createOnboarding(restaurantId.toString());
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    getRestaurantUsers = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const restaurantId = req.user?.restaurant;
            if (!restaurantId) throw new BadRequestError("No tienes un restaurante asociado");

            const users = await staffService.getRestaurantUsers(restaurantId.toString());
            return httpResponse.Ok(res, users);
        } catch (error) {
            next(error);
        }
    };

    getRestaurantInvitations = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const restaurantId = req.user?.restaurant;
            if (!restaurantId) throw new BadRequestError("No tienes un restaurante asociado");

            const invitations = await staffService.getRestaurantInvitations(restaurantId.toString());
            return httpResponse.Ok(res, invitations);
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {

            if (!req.user?.id) throw new BadRequestError("Usuario no encontrado");

            const { name, address, description, phone, type, lat, lng, termsAccepted } = req.body;

            if (!termsAccepted) throw new BadRequestError("Debe aceptar los terminos y condiciones");

            const restaurantData: CreateRestaurantDto = {
                name,
                address,
                description,
                phone,
                type,
                ownerId: req.user.id,
                location: {
                    type: "Point",
                    coordinates: [Number(lng), Number(lat)]
                }
            };

            const response = await this.service.create(restaurantData, req.user.id);
            return httpResponse.Ok(res, response);
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

}

export const restaurantController = new RestaurantController(restaurnatService)