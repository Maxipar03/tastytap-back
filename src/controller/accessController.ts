import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, CustomError, NotFoundError } from "../utils/customError.js";
import { httpResponse } from "../utils/http-response.js";
import { TableModel } from "../daos/mongodb/models/tableModel.js";
import generateToken from "../utils/generateToken.js";
import QRCode from "qrcode";
import config from "../config/config.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getIO } from "../config/socket.js";
import { UserPayload, QRCodePayload } from "../types/express.js";
import { Types } from "mongoose";

class AccessController {

    // QR Generator (whit token)
    generateQRAcces = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { tableId } = req.body;
            const user = req.user as UserPayload;

            if (!user) throw new UnauthorizedError("User not authenticated!")
            if (!tableId) throw new NotFoundError("Table ID is required!")

            const payload: QRCodePayload & JwtPayload = { tableId: new Types.ObjectId(tableId), waiterName: user.name, restaurant: user.restaurant, waiterId: user.id };
            const token = generateToken(payload);

            const link = `${config.FRONT_ENDPOINT}/access/${token}`;

            let qrImage: string

            try {
                qrImage = await QRCode.toDataURL(link);
            } catch (error) {
                throw new CustomError("Error al generar un QR", 500)
            }

            return httpResponse.Ok(res, { qrImage, link })
        } catch (error) {
            next(error)
        }
    };

    // QR Validate
    validateToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.params.token;
            if (!token) throw new NotFoundError("Token access is required");

            if (!config.JWT_SECRET) throw new CustomError("JWT Secret not configured!", 500)
            const secret = config.JWT_SECRET;

            let payload: QRCodePayload;

            try {
                payload = jwt.verify(token, secret) as unknown as QRCodePayload;
            } catch (err) {
                throw new UnauthorizedError("Token inválido o expirado");
            }

            res.cookie('access_token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            });

            const { restaurant, tableId, waiterId } = payload;

            const io = getIO();

            console.log(payload)

            const updatedTable = await TableModel.findByIdAndUpdate(
                tableId,
                {
                    state: "occupied",
                    waiterServing: waiterId
                },
                { new: true }
            ).populate("waiterServing")

            io.to(`restaurant-${restaurant}`).emit("mesa-actualizada", updatedTable);

            return httpResponse.Ok(res, "Accesso Validado correctamente")
        } catch (error) {
            next(error)
        }
    };

    validate = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.mesaData) return httpResponse.NoContent(res)
        return httpResponse.Ok(res, { mesaData: req.mesaData });
    }
}

export const accessController = new AccessController();

