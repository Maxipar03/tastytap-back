import { RestaurantInvitationModel } from "./models/restaurant-invitation.model.js";
import { RestaurantInvitationDao, RestaurantInvitationDB } from "../../types/restaurant-invitation.js";

class RestaurantInvitationMongoDao implements RestaurantInvitationDao {
    create = async (email: string, token: string, expiresAt: Date, role: string, scope: string, restaurantId?: string): Promise<RestaurantInvitationDB> => {
        return await RestaurantInvitationModel.create({ email, token, expiresAt, role, scope, restaurantId });
    };

    getByToken = async (token: string): Promise<RestaurantInvitationDB | null> => {
        return await RestaurantInvitationModel.findOne({ token });
    };

    markAsUsed = async (token: string, restaurantId: string): Promise<RestaurantInvitationDB | null> => {
        return await RestaurantInvitationModel.findOneAndUpdate(
            { token },
            { used: true, restaurantId },
            { new: true }
        );
    };

    getByRestaurant = async (restaurantId: string): Promise<RestaurantInvitationDB[]> => {
        return await RestaurantInvitationModel.find({ restaurantId, used: false });
    };
}

export const restaurantInvitationMongoDao = new RestaurantInvitationMongoDao();
