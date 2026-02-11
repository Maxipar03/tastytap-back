import MongoDao from "./mongo.dao.js";
import { Model } from "mongoose";
import { UserValidationDB } from "../../types/user-validations.js";
import { UserValidationDTO } from "../../dto/user-validations.dto.js";
import { userValidationModel } from "./models/user-validation.model.js";

class UserValidateMongoDao extends MongoDao<UserValidationDB, UserValidationDTO> {
    constructor(model: Model<UserValidationDB>) {
        super(model);
    }

    async getByToken(token: string ): Promise<UserValidationDB | null> {
        return await userValidationModel.findOne({token: token})
    }

}

export const userValidateMongoDao = new UserValidateMongoDao(userValidationModel)