import { restaurantInvitationMongoDao } from "../dao/mongodb/restaurant-invitation.dao.js";
import { RestaurantInvitationDao } from "../types/restaurant-invitation.js";
import generateToken from "../utils/generate-token.js";
import { sendOnboardingEmail } from "../utils/email.js";
import { CustomError } from "../utils/custom-error.js";
import crypto from "crypto";

export default class RestaurantInvitationService {
    private dao: RestaurantInvitationDao;

    constructor(dao: RestaurantInvitationDao) {
        this.dao = dao;
    }

    sendInvitation = async (email: string, role: string, scope: string, restaurantId?: string): Promise<{ message: string }> => {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

        await this.dao.create(email, token, expiresAt, role, scope, restaurantId);
        await sendOnboardingEmail(email, token);

        return { message: "Invitación enviada correctamente" };
    };

    validateToken = async (token: string): Promise<{ valid: boolean; email?: string, token: string }> => {
        const invitation = await this.dao.getByToken(token);

        if (!invitation) throw new CustomError("Token inválido", 400);
        if (invitation.used) throw new CustomError("Este token ya fue utilizado", 400);
        if (invitation.expiresAt < new Date()) throw new CustomError("Token expirado", 400);
        
        return { valid: true, email: invitation.email, token: token };
    };

    markAsUsed = async (token: string, restaurantId: string): Promise<void> => {
        await this.dao.markAsUsed(token, restaurantId);
    };
}

export const restaurantInvitationService = new RestaurantInvitationService(restaurantInvitationMongoDao);
