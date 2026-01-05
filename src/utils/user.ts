import bcrypt from "bcrypt";
import { UserPayload } from "../types/express";
import { JwtPayload } from "jsonwebtoken";
import generateToken from "./generate-token";
import { Response } from "express";
import { httpResponse } from "./http-response";
import { setCookieUser } from "./cookies";

// Crear hash de contraseña
export const createHash = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
};

// Validar hash de contraseña
export const isValidPassword = async (passwordPlain: string, passwordHash: string): Promise<boolean> => {
    return await bcrypt.compare(passwordPlain, passwordHash);
};

// Creacion de payload usuario
export const createUserPayload = (user: any): Promise<UserPayload & JwtPayload> => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant: user.restaurant,
        ...(user.profileImage && { profileImage: user.profileImage })
    };
}

// Manejo de autenticacion de usuario
export const handleAuthSuccess = (res: Response, user: any, isRedirect: boolean = false) => {
    const userPayload = createUserPayload(user);
    const token = generateToken(userPayload, "7d");
    setCookieUser(res, token);

    const tokenTable = res.req.cookies.access_token; 
    const path = tokenTable ? '/menu' : '/';

    if (isRedirect) {
        return res.redirect(`http://localhost:3000${path}`);
    } else {
        return httpResponse.Ok(res, { userPayload, redirect: path });
    }
}