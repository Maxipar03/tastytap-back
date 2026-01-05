import { UserModel } from "./models/user.model.js";
import MongoDao from "./mongo.dao.js";
import { UserDB } from "../../types/user.js";
import { Model } from "mongoose";
import { CreateUserDto } from "../../dto/user.dto.js";

class UserMongoDao extends MongoDao<UserDB, CreateUserDto> {
    constructor(model: Model<UserDB>) {
        super(model);
    }

    getByEmail = async (email: string): Promise <UserDB | null> => {
        try {
            const user = await this.model.findOne({ email }).lean();
            return user as UserDB | null;
        } catch (error) {
            throw error;
        }
    }
}

export const userMongoDao = new UserMongoDao(UserModel)