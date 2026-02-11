import { RestaurantInvitationModel } from "./models/restaurant-invitation.model.js";
import { RestaurantInvitationDao, RestaurantInvitationDB } from "../../types/restaurant-invitation.js";
import { Model } from "mongoose";
import MongoDao from "./mongo.dao.js";

class RestaurantInvitationMongoDao extends MongoDao<RestaurantInvitationDB, any> {

    constructor(model: Model<RestaurantInvitationDB>) {
        super(model);
    }

    getByToken = async (token: string): Promise<RestaurantInvitationDB | null> => {
        return await RestaurantInvitationModel.findOne({ token });
    };

    markAsUsed = async (token: string, restaurantId: string): Promise<RestaurantInvitationDB | null> => {
        return await RestaurantInvitationModel.findOneAndUpdate(
            { token },
            { used: true, restaurantId }
        );
    };

    getByRestaurant = async (restaurantId: string): Promise<RestaurantInvitationDB[]> => {
        return await RestaurantInvitationModel.find({ restaurantId, used: false });
    };
}

export const restaurantInvitationMongoDao = new RestaurantInvitationMongoDao(RestaurantInvitationModel);
