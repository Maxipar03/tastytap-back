import { userMongoDao } from "../daos/mongodb/userDao.js";
import { createHash, isValidPassword } from "../utils/userUtils.js";
import { UserDao, UserDB } from "../types/user.js";
import { BadRequestError, CustomError } from "../utils/customError.js";
import { CreateUserDto } from "../DTO/userDto.js";

class UserServices {

    private dao: UserDao

    constructor(dao: UserDao) {
        this.dao = dao;
    }

    getById = async (id: string): Promise<UserDB | null> => {
            return await this.dao.getById(id);
    }

    getByEmail = async (email: string): Promise<UserDB | null> => {
            return await this.dao.getByEmail(email);
    }

    login = async (email:string, password:string): Promise<UserDB> => {
        try {
            const userExist = await this.getByEmail(email);
            if (!userExist || userExist.isGoogle || !userExist.password) throw new BadRequestError("Las credenciales son incorrectas");

            const validPassword = isValidPassword(password, userExist.password);
            if (!validPassword) throw new BadRequestError("Las credenciales son incorrectas");
            
            return userExist;
        } catch (error) {
            throw error
        }
    };

    register = async (body: CreateUserDto): Promise<UserDB>=> {
        try {
            const { email, password } = body;
            const user = await this.getByEmail(email);
            if (user) throw new BadRequestError("El usuario ya existe");

            let userData = { ...body };

            if (!userData.isGoogle) {
                if (!password) throw new BadRequestError("La contraseña es requerida");
                userData.password = createHash(password);
            }

            const response = await this.dao.create(userData);

            if (!response) throw new CustomError("Error al crear el usuario", 500);
            return response;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

}

export const userService = new UserServices(userMongoDao);