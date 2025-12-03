import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import { QRTablePayload, QRToGoPayload, UserPayload } from "../types/express.js";
import { UnauthorizedError } from "../utils/customError.js";
import config from "../config/config.js";
import { clearCookieAccess, clearCookieOrder, clearCookieUser } from "../utils/cookies.js";

// Verify token access 
export const verifyTokenAccess = (req: Request, res: Response, next: NextFunction) => {

    const token = req.cookies.access_token
    if (!token) throw new UnauthorizedError('No estás autorizado.')

    jwt.verify(token, config.JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            clearCookieAccess(res)
            return next(new UnauthorizedError("El token es invalido o esta expirado"));
        }
        
        // Detectar si es tableData o toGoData basado en las propiedades del token
        if (decoded.tableId && decoded.waiterId) {
            // Es tableData
            const tableData = decoded as QRTablePayload;
            req.tableData = {
                waiterName: tableData.waiterName,
                restaurant: tableData.restaurant,
                tableId: tableData.tableId,
                waiterId: tableData.waiterId,
                toGo: false
            };
        } else {
            // Es toGoData
            const toGoData = decoded as QRToGoPayload;
            req.toGoData = {
                restaurant: toGoData.restaurant,
                toGo: true
            };
        }
        
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
        
        const token = req.cookies.user_token;
        
        if (!token) {
            if (isOptional) return next();
            throw new UnauthorizedError("No estás autorizado.");
        }
        
        const userData = decodeUserToken(token);

        if (!userData) {
            clearCookieUser(res);
            if (!isOptional) return next(new UnauthorizedError("Token inválido o expirado"));
            return next();
        }

        req.user = {
            id: userData.id,
            name: userData.name,
            restaurant: userData.restaurant,
            role: userData.role,
            email: userData.email,
            ...(userData.profileImage && { profileImage: userData.profileImage })
        };

        next();
    };
};

export const verifyTokenOrder = (req: Request, res: Response, next: NextFunction) => {

    const token = req.cookies.order_token

    if (!token) throw new UnauthorizedError('No estás autorizado.')

    jwt.verify(token, config.JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            clearCookieOrder(res);
            return next(new UnauthorizedError("El token es invalido o esta expirado"));
        }

        const { orderId } = decoded as { orderId: string };

        if (!orderId) return next(new UnauthorizedError("Token inválido"));

        req.orderId = orderId;
        next();
    })
}

const createOrderTokenMiddleware = (isOptional: boolean = false) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies.order_token;
        
        if (!token) {
            if (isOptional) {
                return next();
            }
            throw new UnauthorizedError('No estás autorizado.');
        }
        
        jwt.verify(token, config.JWT_SECRET, (err: any, decoded: any) => {
            if (err) {
                clearCookieOrder(res);
                if (!isOptional) {
                    return next(new UnauthorizedError("El token es invalido o esta expirado"));
                }
                return next();
            }
            
            const { orderId } = decoded as { orderId: string };
            
            if (!orderId) {
                if (!isOptional) {
                    return next(new UnauthorizedError("Token inválido"));
                }
                return next();
            }
            
            req.orderId = orderId;
            next();
        });
    };
};

export const verifyTokenUser = createUserTokenMiddleware();

export const optionalVerifyTokenUser = createUserTokenMiddleware(true);

export const verifyTokenOrderOptional = createOrderTokenMiddleware(true);