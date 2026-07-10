import { invitationMongoDao } from "../dao/mongodb/invitation.dao.js";
import { InvitationDao, InvitationDB } from "../types/invitation.types.js";
// import { sendOnboardingEmail } from "../utils/email.utils.js";
import { CustomError } from "../utils/custom-error.utils.js";
import crypto from "crypto";
import { UserRole } from "../types/user.types.js";

export default class InvitationService {
    private dao: InvitationDao;

    constructor(dao: InvitationDao) {
        this.dao = dao;
    }

    createInvitation = async (email: string, role: UserRole, restaurantId?: string): Promise<{ message: string }> => {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

        await this.dao.create(email, token, expiresAt, role, restaurantId);
        // await sendOnboardingEmail(email, token);

        return { message: "Invitación enviada correctamente" };
    };

    verifyInvitationToken = async (token: string): Promise<{ valid: boolean; email?: string, token: string }> => {
        const invitation = await this.dao.getByToken(token) as InvitationDB;

        if (!invitation) throw new CustomError("Token inválido", 400);
        if (invitation.used) throw new CustomError("Este token ya fue utilizado", 400);
        if (invitation.expiresAt < new Date()) throw new CustomError("Token expirado", 400);
        if (!invitation.restaurantId) throw new CustomError("Token no pertenece a ningún restaurante", 400);

        await this.dao.markAsUsed(token, invitation.restaurantId.toString());

        return { valid: true, email: invitation.email, token: token };
    };
}

export const invitationService = new InvitationService(invitationMongoDao);
