import { userMongoDao } from "../dao/mongodb/user.dao.js";
import { invitationMongoDao } from "../dao/mongodb/invitation.dao.js";
import { UserDB } from "../types/user.types.js";
import { InvitationDB } from "../types/invitation.types.js";

class StaffService {
    getRestaurantUsers = async (restaurantId: string): Promise<UserDB[]> => {
        return await userMongoDao.getByRestaurant(restaurantId);
    };

    getRestaurantInvitations = async (restaurantId: string): Promise<InvitationDB[]> => {
        return await invitationMongoDao.getByRestaurant(restaurantId);
    };
}

export const staffService = new StaffService();
