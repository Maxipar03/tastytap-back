import { restaurantInvitationMongoDao } from "../dao/mongodb/restaurant-invitation.dao.js";
import { RestaurantInvitationDao, RestaurantInvitationDB } from "../types/restaurant-invitation.js";
import { sendOnboardingEmail } from "../utils/email.js";
import { CustomError } from "../utils/custom-error.js";
import crypto from "crypto";
import { UserRole } from "../types/user.js";

export default class RestaurantInvitationService {
    private dao: RestaurantInvitationDao;

    constructor(dao: RestaurantInvitationDao) {
        this.dao = dao;
    }

    sendInvitation = async (email: string, role: UserRole, restaurantId?: string): Promise<{ message: string }> => {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

        await this.dao.create(email, token, expiresAt, role, restaurantId);
        await sendOnboardingEmail(email, token);

        return { message: "Invitación enviada correctamente" };
    };

    validateToken = async (token: string): Promise<{ valid: boolean; email?: string, token: string }> => {
        const invitation = await this.dao.getByToken(token) as RestaurantInvitationDB;

        if (!invitation) throw new CustomError("Token inválido", 400);
        if (invitation.used) throw new CustomError("Este token ya fue utilizado", 400);
        if (invitation.expiresAt < new Date()) throw new CustomError("Token expirado", 400);
        if (!invitation.restaurantId) throw new CustomError("Token no pertenece a ningún restaurante", 400);

        await this.dao.markAsUsed(token, invitation.restaurantId.toString());

        return { valid: true, email: invitation.email, token: token };
    };
}

export const restaurantInvitationService = new RestaurantInvitationService(restaurantInvitationMongoDao);
