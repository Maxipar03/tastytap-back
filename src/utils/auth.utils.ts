import bcrypt from "bcrypt";
import { UserPayload } from "../types/express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config/env.config";

type Expiry = number | `${number}${"ms" | "s" | "m" | "h" | "d" | "y"}`;

// Crear hash de contraseña
export const createHash = (password: string) => bcrypt.hash(password, 10);

// Validar hash de contraseña
export const isValidPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// Creacion de payload usuario
export const createUserPayload = (user: any): Promise<UserPayload & JwtPayload> => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        restaurant: user.restaurant,
        ...(user.profileImage && { profileImage: user.profileImage })
    };
}

export const generateToken = (payload: object, expiresIn: Expiry = "1h"): string => {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

