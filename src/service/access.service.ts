
import { QRTablePayload, QRToGoPayload, QRResponse } from "../types/express.js";
import generateToken from "../utils/generate-token.js";
import config from "../config/config.js";
import jwt from "jsonwebtoken";
import { accessEvents } from "../events/access.events.js";
import { CustomError, NotFoundError } from "../utils/custom-error.js";
import QRCode from "qrcode";
import { Types } from "mongoose";
import { tableServices } from "./table.service.js";

type Expiry = number | `${number}${"ms" | "s" | "m" | "h" | "d" | "y"}`;

export default class AccessServices {

    generateAccessQR = async (payload: QRToGoPayload | QRTablePayload, type: 'table' | 'takeaway', expiresIn: Expiry = "3h"): Promise<QRResponse> => {
        const token = generateToken(payload, expiresIn);
        const endpoint = type === 'table' ? '/access/table' : '/access/takeaway';
        const link = `${config.FRONT_ENDPOINT}${endpoint}/${token}`;

        let qrImage: string;
        try {
            qrImage = await QRCode.toDataURL(link);
        } catch (error) {
            throw new CustomError("Error al generar el código QR", 500);
        }

        return { qrImage, link, token };
    };

    handleTableAccess = async (payload: QRTablePayload): Promise<QRTablePayload> => {
        const { restaurant, tableId, waiterId } = payload;

        const updateData = {
            state: 'occupied' as const,
            waiterServing: waiterId
        };
        const updatedTable = await tableServices.update(tableId, updateData, restaurant.id);

        if (!updatedTable) throw new NotFoundError("Table not found for update.");

        return payload;
    };

    handleToGoAccess = async (restaurantId: string | Types.ObjectId): Promise<void> => {
        accessEvents.emitQRUsed({ restaurant: restaurantId });
    };

    verifyQrToken = async (token: string): Promise<QRTablePayload> => {
        if (!config.JWT_SECRET) throw new CustomError("JWT Secret not configured!", 500);
        try {
            const payload = jwt.verify(token, config.JWT_SECRET) as QRTablePayload;
            return payload;
        } catch (err) {
            throw new CustomError("Token inválido o expirado",500);
        }
    }

}

export const accessService = new AccessServices();