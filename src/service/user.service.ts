import { userMongoDao } from "../dao/mongodb/user.dao.js";
import { createHash, isValidPassword } from "../utils/auth.utils.js";
import { UserDao, UserDB } from "../types/user.types.js";
import { BadRequestError } from "../utils/custom-error.utils.js";
import { CreateUserDto } from "../dto/user.dto.js";
import { randomInt } from 'crypto';
import logger from "../config/logger.config.js";
import cache from "../utils/cache.utils.js";
import { Types } from "mongoose";
import { sendVerificationEmail } from "../utils/email.utils.js";

export default class UserServices {

    private dao: UserDao

    constructor(dao: UserDao) {
        this.dao = dao;
    }

    getById = async (id: string): Promise<UserDB | null> => {
        const cacheKey = `user:${id}`;
        const cached = await cache.get<UserDB>(cacheKey);
        if (cached) return cached;

        const user = await this.dao.getById(id);
        if (user) await cache.set(cacheKey, user, 600); // 10 minutos
        return user;
    };

    getByEmail = async (email: string): Promise<UserDB | null> => this.dao.getByEmail(email);

    getByRestaurant = async (restaurantId: string): Promise<UserDB[]> => {
        return await userMongoDao.getByRestaurant(restaurantId);
    };

    login = async (email: string, password: string): Promise<UserDB> => {
        try {
            logger.debug({ email }, "Buscando usuario para login");
            const userExist = await this.getByEmail(email);

            if (!userExist) {
                logger.warn({ email }, "Intento de login con email no registrado");
                throw new BadRequestError("Las credenciales son incorrectas");
            }

            if (userExist.isGoogle || !userExist.password) {
                logger.warn({ email, isGoogle: userExist.isGoogle }, "Intento de login con contraseña en cuenta Google");
                throw new BadRequestError("Las credenciales son incorrectas");
            }

            const validPassword = await isValidPassword(password, userExist.password);
            if (!validPassword) {
                logger.warn({ email }, "Intento de login con contraseña incorrecta");
                throw new BadRequestError("Las credenciales son incorrectas");
            }

            logger.info({ userId: userExist._id, email }, "Login exitoso");
            return userExist;
        } catch (error) {
            throw error
        }
    };

    register = async (body: CreateUserDto): Promise<UserDB> => {
        try {
            const { email, password, isGoogle } = body;

            logger.debug({ email, isGoogle }, "Iniciando registro de usuario");

            const user = await this.getByEmail(email);

            console.log(user);
            if (user) {
                logger.warn({ email }, "Intento de registro con email ya existente");
                throw new BadRequestError("El usuario ya existe");
            }

            let userData = { ...body };

            if (!userData.isGoogle) {
                if (!password) {
                    logger.warn({ email }, "Intento de registro sin contraseña");
                    throw new BadRequestError("La contraseña es requerida");
                }
                userData.password = await createHash(password);
                userData.isVerified = false;
            }

            const otpCode = randomInt(100000, 999999).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

            try {
                await sendVerificationEmail(email, otpCode);
                logger.info({ email }, "Email de verificacion enviado exitosamente");
            } catch (error: any) {
                logger.error({
                    email,
                    errorMessage: error?.message,
                    errorCode: error?.code,
                    errorResponse: error?.response,
                    errorCommand: error?.command,
                }, "FALLO al enviar el email de verificacion");
                // No lanzamos el error para no bloquear el registro,
                // pero el detalle completo queda en los logs.
            }

            userData.isVerified = false;
            userData.verificationCode = otpCode;
            userData.verificationCodeExpires = otpExpires;

            const response = await this.dao.create(userData);

            logger.info({ userId: response._id, email, isGoogle }, "Usuario registrado exitosamente");

            return response;
        } catch (error) {
            logger.error({ email: body.email, error: error }, "Error en registro de usuario");
            throw error;
        }
    }

    verify = async (userId: string, code: string): Promise<UserDB> => {
        try {
            logger.debug({ userId, code }, "Iniciando verificacion de usuario");

            const user = await this.dao.getById(userId);

            if (!user) {
                logger.warn({ userId }, "Intento de verificacion con usuario no existente");
                throw new BadRequestError("Usuario no encontrado");
            }

            if (user.isVerified) {
                logger.warn({ userId }, "Intento de verificacion con usuario ya verificado");
                throw new BadRequestError("Usuario ya verificado");
            }

            if (user.verificationCode !== code) {
                logger.warn({ userId }, "Intento de verificacion con codigo incorrecto");
                throw new BadRequestError("Codigo incorrecto");
            }

            if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
                logger.warn({ userId }, "Intento de verificacion con codigo expirado");
                throw new BadRequestError("Codigo expirado");
            }

            user.isVerified = true;
            user.verificationCode = null;
            user.verificationCodeExpires = null;

            const response = await this.dao.update(userId, user);

            logger.info({ userId }, "Usuario verificado exitosamente");

            return response as UserDB;
        } catch (error) {
            logger.error({ userId: userId, error: error }, "Error en verificacion de usuario");
            throw error;
        }
    }

    resendVerification = async (userId: string): Promise<void> => {
        try {
            logger.debug({ userId }, "Reenviando email de verificacion");

            const user = await this.dao.getById(userId);

            if (!user) {
                logger.warn({ userId }, "Intento de reenvio de email con usuario no existente");
                throw new BadRequestError("Usuario no encontrado");
            }

            if (user.isVerified) {
                logger.warn({ userId }, "Intento de reenvio de email con usuario ya verificado");
                throw new BadRequestError("Usuario ya verificado");
            }

            const lastSent = user.verificationCodeExpires!.getTime() - 10 * 60 * 1000;
            if (lastSent && Date.now() - lastSent < 60 * 1000) {
                throw new BadRequestError("Esperá 1 minuto antes de reenviar");
            }

            const otpCode = randomInt(100000, 999999).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

            user.verificationCode = otpCode;
            user.verificationCodeExpires = otpExpires;

            await this.dao.update(userId, user);
            await sendVerificationEmail(user.email, otpCode);

            logger.info({ userId }, "Email de verificacion reenviado exitosamente");
        } catch (error) {
            logger.error({ userId: userId, error: error }, "Error en reenvio de email de verificacion");
            throw error;
        }
    }

}

export const userService = new UserServices(userMongoDao);