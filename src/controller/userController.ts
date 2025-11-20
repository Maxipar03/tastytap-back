import { userService } from "../services/userService.js";
import { UserService } from "../types/user.js";;
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/customError.js";
import { handleAuthSuccess } from "../utils/userUtils.js";
import { httpResponse } from "../utils/http-response.js";
import { clearCookieUser } from "../utils/cookies.js";
import logger from "../utils/logger.js";

class UserController {

    private service: UserService;

    constructor(services: UserService) {
        this.service = services;
    }

    googleResponse = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                logger.warn({ ip: req.ip, userAgent: req.get('User-Agent') }, "Intento de autenticacion Google sin usuario");
                throw new BadRequestError("No se encontro el usuario");
            }
            logger.info({ userId: req.user.id, email: req.user.email }, "Autenticacion Google exitosa");
            return handleAuthSuccess(res, req.user, true);
        } catch (error) {
            next(error);
        }
    }

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            logger.info({ email, ip: req.ip }, "Intento de registro de usuario");
            const newUser = await this.service.register(req.body);
            logger.info({ userId: newUser.id, email: newUser.email }, "Usuario registrado exitosamente");
            return handleAuthSuccess(res, newUser, false);
        } catch (error) {
            logger.warn({ email: req.body.email, error: error }, "Error en registro de usuario");
            next(error);
        }
    }

    logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            clearCookieUser(res);
            logger.info({ userId }, "Usuario cerro sesion");
            return httpResponse.Ok(res, "Sesion cerrada correctamente");
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            logger.info({ email, ip: req.ip }, "Intento de inicio de sesion");
            const user = await this.service.login(email, req.body.password);
            logger.info({ userId: user.id, email: user.email }, "Inicio de sesion exitoso");
            return handleAuthSuccess(res, user);
        } catch (error) {
            logger.warn({ email: req.body.email, ip: req.ip, error: error }, "Error en inicio de sesion");
            next(error);
        }
    }

    getUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            return httpResponse.Ok(res, req.user)
        } catch (error) {
            next(error);
        }
    }
}

export const userController = new UserController(userService)