import { userService } from "../service/user.service.js";
import { UserService } from "../types/user.types.js";;
import { Request, Response, NextFunction } from "express";
import { BadRequestError, UnauthorizedError } from "../utils/custom-error.utils.js";
import { httpResponse } from "../utils/response.utils.js";
import { createUserPayload, generateToken } from "../utils/auth.utils.js";
import { clearCookieUser, setCookieUser } from "../utils/cookies.utils.js";
import logger from "../config/logger.config.js";
import { CreateUserDto, LoginUserDto } from "../dto/user.dto.js";
import { Types } from "mongoose";

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

            const userPayload = createUserPayload(req.user);
            const token = generateToken(userPayload, "7d");
            setCookieUser(res, token);

            if (req.user.role === 'ADMIN' || req.user.role === 'OWNER') {
                return res.redirect('http://localhost:3001');
            }

            return res.redirect('http://localhost:3000');

            // return httpResponse.Ok(res, { userPayload, redirect: '/menu' });
        } catch (error) {
            next(error);
        }
    }

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log(req.body)
            const body = req.body as CreateUserDto;
            const { email } = body;
            logger.info({ email, ip: req.ip }, "Intento de registro de usuario");

            const newUser = await this.service.register(body);
            logger.info({ userId: newUser.id, email: newUser.email }, "Usuario registrado exitosamente");

            const userPayload = createUserPayload(newUser);
            const token = generateToken(userPayload, "7d");
            setCookieUser(res, token);

            return httpResponse.Created(res, { userPayload, redirect: '/menu' });
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
            const body = req.body as LoginUserDto;
            console.log(body)
            const { email, password } = body;
            logger.info({ email, ip: req.ip }, "Intento de inicio de sesion");

            const user = await this.service.login(email, password);
            logger.info({ userId: user.id, email: user.email }, "Inicio de sesion exitoso");

            const userPayload = createUserPayload(user);
            const token = generateToken(userPayload, "7d");
            setCookieUser(res, token);

            return httpResponse.Ok(res, { userPayload, redirect: '/menu' });
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

    verify = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            const { code } = req.body;
            logger.info({ userId: user?.id, email: user?.email }, "Intento de verificacion de usuario");

            if (!user?.id) throw new UnauthorizedError("Usuario no autenticado");
            const userIdStr = user.id.toString();

            const userVerified = await this.service.verify(userIdStr, code);
            logger.info({ userId: user?.id, email: user?.email }, "Verificacion de usuario exitosa");

            return httpResponse.Ok(res, userVerified);
        } catch (error) {
            logger.warn({ userId: req.user?.id, email: req.user?.email, error: error }, "Error en verificacion de usuario");
            next(error);
        }
    }

    resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const user = req.user;
            if (!user?.id) throw new BadRequestError("No se pudo obtener el usuario")

            await this.service.resendVerification(user.id.toString());
            httpResponse.Ok(res, { message: "Email reenviado" });
        } catch (error) {
            next(error);
        }
    };
}

export const userController = new UserController(userService)