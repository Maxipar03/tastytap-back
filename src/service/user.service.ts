import { userMongoDao } from "../dao/mongodb/user.dao.js";
import { createHash, isValidPassword } from "../utils/user.js";
import { UserDao, UserDB } from "../types/user.js";
import { BadRequestError } from "../utils/custom-error.js";
import { CreateUserDto } from "../dto/user.dto.js";
import logger from "../utils/logger.js";
import cache from "../utils/cache.js";

class UserServices {

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

    login = async (email:string, password:string): Promise<UserDB> => {
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

    register = async (body: CreateUserDto): Promise<UserDB>=> {
        try {
            const { email, password, isGoogle } = body;
            
            logger.debug({ email, isGoogle }, "Iniciando registro de usuario");
            
            const user = await this.getByEmail(email);
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
                userData.isValidateMail = false;
            }

            const response = await this.dao.create(userData);
            
            logger.info({ userId: response._id, email, isGoogle }, "Usuario registrado exitosamente");
            
            return response;
        } catch (error) {
            logger.error({ email: body.email, error: error }, "Error en registro de usuario");
            throw error;
        }
    }

}

export const userService = new UserServices(userMongoDao);