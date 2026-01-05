import { Request, Response,NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/custom-error";

export const checkRole = (allowedRoles: string | string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) throw new UnauthorizedError("Unauthorized");
        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!rolesArray.includes(req.user.role)) throw new ForbiddenError("No permitido")
        next();
    };
};