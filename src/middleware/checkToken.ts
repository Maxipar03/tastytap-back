import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import { QRCodePayload, UserPayload } from "../types/express.js";
import { UnauthorizedError } from "../utils/customError.js";
import config from "../config/config.js";

// Verify seat token
export const verifyTokenSeat = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.seat_token;

    if (!token) throw new UnauthorizedError('No estás autorizado.')

    req.seatData = { token };
    next();
}

// Verify token access 
export const verifyTokenAccess = (req: Request, res: Response, next: NextFunction) => {

    const token = req.cookies.access_token

    if (!token) throw new UnauthorizedError('No estás autorizado.')

    jwt.verify(token, config.JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            res.clearCookie('access_token', {
                httpOnly: true,
                sameSite: 'lax',
            });

            return next(new UnauthorizedError("El token es invalido o esta expirado"));
        }
        const mesaData = decoded as QRCodePayload;
        req.mesaData = {
            waiterName: mesaData.waiterName,
            restaurant: mesaData.restaurant,
            tableId: mesaData.tableId,
            waiterId: mesaData.waiterId
        };
        next();
    })
}

const decodeUserToken = (token: string): UserPayload | null => {
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as UserPayload;
        return decoded;
    } catch (err) {
        return null;
    }
};

const createUserTokenMiddleware = (isOptional: boolean = false) => {
    return (req: Request, res: Response, next: NextFunction) => {
        
        const token = req.cookies.user_info;
        
        if (!token) {
            if (isOptional) {
                return next();
            }
            throw new UnauthorizedError("No estás autorizado.");
        }
        
        const userData = decodeUserToken(token);

        if (!userData) {
            res.clearCookie("user_info", {
                httpOnly: true,
                sameSite: "strict",
            });
            if (!isOptional) {
                return next(new UnauthorizedError("Token inválido o expirado"));
            }
            return next();
        }

        req.user = {
            id: userData.id,
            name: userData.name,
            restaurant: userData.restaurant,
            role: userData.role,
            email: userData.email,
        };

        next();
    };
};

export const verifyTokenUser = createUserTokenMiddleware();

export const optionalVerifyTokenUser = createUserTokenMiddleware(true);