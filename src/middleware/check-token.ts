import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import { QRTablePayload, QRToGoPayload, UserPayload } from "../types/express.js";
import { UnauthorizedError } from "../utils/custom-error.js";
import config from "../config/config.js";
import { clearCookieAccess, clearCookieOrder, clearCookieUser } from "../utils/cookies.js";

const verifyToken = <T>(token: string): T | null => {
    try {
        return jwt.verify(token, config.JWT_SECRET) as T;
    } catch {
        return null;
    }
};

export const verifyTokenAccess = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token;
    if (!token) throw new UnauthorizedError('No estás autorizado.');

    const decoded = verifyToken<QRTablePayload | QRToGoPayload>(token);
    if (!decoded) {
        clearCookieAccess(res);
        return next(new UnauthorizedError("El token es invalido o esta expirado"));
    }

    if (decoded.toGo === false) {
        req.tableData = {
            waiter: decoded.waiter,
            restaurant: decoded.restaurant,
            table: decoded.table,
            toGo: false
        };
    } else {
        req.toGoData = {
            restaurant: decoded.restaurant,
            toGo: true
        };
    }
    next();
};

const createUserTokenMiddleware = (isOptional: boolean = false) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies.user_token;

        if (!token) {
            if (isOptional) return next();
            throw new UnauthorizedError("No estás autorizado.");
        }

        const userData = verifyToken<UserPayload>(token);
        if (!userData) {
            clearCookieUser(res);
            if (!isOptional) return next(new UnauthorizedError("Token inválido o expirado"));
            return next();
        }

        req.user = {
            id: userData.id,
            name: userData.name,
            isValidateMail: userData.isValidateMail,
            restaurant: userData.restaurant,
            role: userData.role,
            email: userData.email,
            ...(userData.profileImage && { profileImage: userData.profileImage })
        };
        next();
    };
};

const createOrderTokenMiddleware = (isOptional: boolean = false) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies.order_token;

        if (!token) {
            if (isOptional) return next();
            throw new UnauthorizedError('No estás autorizado.');
        }

        const decoded = verifyToken<{ orderId: string }>(token);
        if (!decoded?.orderId) {
            clearCookieOrder(res);
            if (!isOptional) return next(new UnauthorizedError("El token es invalido o esta expirado"));
            return next();
        }

        req.orderId = decoded.orderId;
        next();
    };
};

export const verifyTokenOrder = createOrderTokenMiddleware();

export const verifyTokenUser = createUserTokenMiddleware();

export const optionalVerifyTokenUser = createUserTokenMiddleware(true);

export const optionalVerifyTokenOrder = createOrderTokenMiddleware(true);