import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import { UserPayload } from "../types/express.js";
import { UnauthorizedError } from "../utils/custom-error.utils.js";
import config from "../config/env.config.js";
import { clearCookieUser } from "../utils/cookies.utils.js";

const decodeToken = <T>(token: string): T | null => {
    try {
        return jwt.verify(token, config.JWT_SECRET) as T;
    } catch {
        return null;
    }
};

const createAuthMiddleware = (isOptional: boolean = false) => {
    return (req: Request, res: Response, next: NextFunction) => {
        
        const token = req.cookies.user_token;
        if (!token) {
            if (isOptional) return next();
            throw new UnauthorizedError("No estás autorizado.");
        }

        const userData = decodeToken<UserPayload>(token);
        if (!userData) {
            clearCookieUser(res);
            if (!isOptional) return next(new UnauthorizedError("Token inválido o expirado"));
            return next();
        }

        req.user = {
            id: userData.id,
            name: userData.name,
            isVerified: userData.isVerified,
            restaurant: userData.restaurant,
            role: userData.role,
            email: userData.email,
            ...(userData.profileImage && { profileImage: userData.profileImage })
        };
        
        next();
    };
};

export const authenticate = createAuthMiddleware();

export const authenticateOptional = createAuthMiddleware(true);
