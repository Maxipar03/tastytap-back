import { Types } from "mongoose";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/email";
import { UserValidationDao, UserValidationDB } from "../types/user-validations";
import { userValidateMongoDao } from "../dao/mongodb/user-validations.dao";
import { userMongoDao } from "../dao/mongodb/user.dao";
import { BadRequestError } from "../utils/custom-error";

class UserValidationsService {

    private dao: UserValidationDao;

    constructor(dao: UserValidationDao) {
        this.dao = dao;
    }

    getByToken = async(token: string): Promise<UserValidationDB | null> => {
        try{
            const data = await this.dao.getByToken(token);
            return data;
        }catch(error){
            throw error
        }
    }

    CreateUserValidation = async (userId: Types.ObjectId): Promise<void | null> => {
        try {
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

            const user = await userMongoDao.getById(userId);
            if (!user) throw new BadRequestError("No se encontro el usaurio a validar");
            if (user.isValidateMail) throw new BadRequestError("El usuario ya se encuentra validado");

            const data = {
                user: userId,
                token,
                expiresAt,
                type: "EMAIL_VERIFICATION"
            }

            await this.dao.create(data);
            await sendVerificationEmail(user?.email, token);
        } catch (error) {
            throw error;
        }
    };

    validateToken = async (token: string): Promise<UserValidationDB| null> => {
        try {
            const validation = await this.getByToken(token);
            if (validation?.used || !validation) throw new BadRequestError("El token no es valido");

            await userMongoDao.update(validation.user, {isValidateMail: true});
            const data = this.dao.update(validation._id, {used: true});
            return data
        } catch (error) {
            throw error;
        }
    }

}

export const userValidationServices = new UserValidationsService(userValidateMongoDao);