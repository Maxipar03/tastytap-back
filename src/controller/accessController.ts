import { Request, Response, NextFunction } from "express";
import { accessService } from "../services/accessServices.js";
import { UnauthorizedError, NotFoundError } from "../utils/customError.js";
import { httpResponse } from "../utils/http-response.js";
import { RestaurantModel } from "../daos/mongodb/models/restaurantModel.js";
import { JwtPayload } from "jsonwebtoken";
import { UserPayload, QRTablePayload, QRToGoPayload } from "../types/express.js";
import { Types } from "mongoose";
import { setCookieAccess } from "../utils/cookies.js";
import { AccessServices } from "../types/express.js";

class AccessController {

    private service: AccessServices;

    constructor(services: AccessServices) {
        this.service = services;
    };

    // QR Generator (whit token)
    generateQRtable = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { tableId } = req.body;
            const user = req.user as UserPayload;

            if (!user) throw new UnauthorizedError("User not authenticated!")
            if (!tableId) throw new NotFoundError("Table ID is required!")

            const restaurant = await RestaurantModel.findById(user.restaurant).select('name logo');
            if (!restaurant) throw new NotFoundError("Restaurant not found!");

            const payload: QRTablePayload & JwtPayload = {
                tableId: new Types.ObjectId(tableId),
                waiterName: user.name,
                restaurant: {
                    id: restaurant._id,
                    name: restaurant.name,
                    ...(restaurant.logo && { logo: restaurant.logo })
                },
                waiterId: user.id,
                toGo: false
            };

            const { qrImage, link } = await this.service.generateAccessQR(payload, 'table');

            return httpResponse.Ok(res, { qrImage, link })
        } catch (error) {
            next(error)
        }
    };

    // QR Generator (whit token)
    generateQRtoGo = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const user = req.user as UserPayload;

            if (!user) throw new UnauthorizedError("User not authenticated!")

            const restaurant = await RestaurantModel.findById(user.restaurant).select('name logo');
            if (!restaurant) throw new NotFoundError("Restaurant not found!");

            const payload: QRToGoPayload & JwtPayload = {
                restaurant: {
                    id: restaurant._id,
                    name: restaurant.name,
                    ...(restaurant.logo && { logo: restaurant.logo })
                },
                toGo: true
            };

            const { qrImage, link } = await this.service.generateAccessQR(payload, 'takeaway');

            return httpResponse.Ok(res, { qrImage, link })
        } catch (error) {
            next(error)
        }
    };

    // QR Validate
    validateTokenTable = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.params.token;
            if (!token) throw new NotFoundError("Token access is required");

            const payload = await this.service.verifyQrToken(token);

            setCookieAccess(res, token);

            await this.service.handleTableAccess(payload);

            return httpResponse.Ok(res, payload)
        } catch (error) {
            next(error)
        }
    };

    // QR Validate
    validateTokenToGo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.params.token;
            if (!token) throw new NotFoundError("Token access is required");

            const payload = await this.service.verifyQrToken(token);

            setCookieAccess(res, token)
            const { restaurant } = payload;

            await this.service.handleToGoAccess(restaurant.id);

            return httpResponse.Ok(res, payload)
        } catch (error) {
            next(error)
        }
    };

    validate = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.tableData && !req.toGoData) return httpResponse.NoContent(res)
        return httpResponse.Ok(res, { tableData: req.tableData, toGoData: req.toGoData });
    }
}

export const accessController = new AccessController(accessService);

