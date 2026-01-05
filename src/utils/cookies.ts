import { Response, CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

// Configuracion base de todas las cookies
const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
};

// Crear y asignar cookie
export const setCookie = (
    res: Response,
    name: string,
    token: string,
    options: CookieOptions = {}
): void => {
    res.cookie(name, token, { ...baseCookieOptions, ...options });
};

// Eliminar cookie
export const clearCookie = (res: Response, name: string): void => {
    res.clearCookie(name, baseCookieOptions);
};

// Asignacion de cookies especificas
export const setCookieOrder = (res: Response, token: string) =>
    setCookie(res, "order_token", token, { maxAge: 1000 * 60 * 60 * 3 }); // 3h

export const setCookieAccess = (res: Response, token: string) =>
    setCookie(res, "access_token", token, { maxAge: 1000 * 60 * 60 * 3 }); // 3h

export const setCookieUser = (res: Response, token: string) =>
    setCookie(res, "user_token", token, { maxAge: 1000 * 60 * 60 * 24 * 7 }); // 7d

// Eliminacion de cookies especificas
export const clearCookieOrder = (res: Response) => clearCookie(res, "order_token");
export const clearCookieAccess = (res: Response) => clearCookie(res, "access_token");
export const clearCookieUser = (res: Response) => clearCookie(res, "user_token");