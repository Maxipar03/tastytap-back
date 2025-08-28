import { UserModel } from "./models/userModel.js";
import MongoDao from "./mongoDao.js";
import { UserDB } from "../../types/user.js";
import { Model } from "mongoose";
import { CreateUserDto } from "../../DTO/userDto.js";

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