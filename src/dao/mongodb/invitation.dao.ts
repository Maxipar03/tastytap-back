import { InvitationModel } from "./models/invitation.model.js";
import { InvitationDB } from "../../types/invitation.types.js";
import { Model } from "mongoose";
import MongoDao from "./mongo.dao.js";

class InvitationMongoDao extends MongoDao<InvitationDB, any> {

    constructor(model: Model<InvitationDB>) {
        super(model);
    }

    getByToken = async (token: string): Promise<InvitationDB | null> => {
        return await InvitationModel.findOne({ token });
    };

    markAsUsed = async (token: string, restaurantId: string): Promise< InvitationDB | null> => {
        return await InvitationModel.findOneAndUpdate(
            { token },
            { used: true, restaurantId }
        );
    };

    getByRestaurant = async (restaurantId: string): Promise<InvitationDB[]> => {
        return await InvitationModel.find({ restaurantId, used: false });
    };
}

export const invitationMongoDao = new InvitationMongoDao(InvitationModel);
