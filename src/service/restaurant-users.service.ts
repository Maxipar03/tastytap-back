import { userMongoDao } from "../dao/mongodb/user.dao.js";
import { restaurantInvitationMongoDao } from "../dao/mongodb/restaurant-invitation.dao.js";
import { UserDB } from "../types/user.js";
import { RestaurantInvitationDB } from "../types/restaurant-invitation.js";

class RestaurantUsersService {
    getRestaurantUsers = async (restaurantId: string): Promise<UserDB[]> => {
        return await userMongoDao.getByRestaurant(restaurantId);
    };

    getRestaurantInvitations = async (restaurantId: string): Promise<RestaurantInvitationDB[]> => {
        return await restaurantInvitationMongoDao.getByRestaurant(restaurantId);
    };
}

export const restaurantUsersService = new RestaurantUsersService();
