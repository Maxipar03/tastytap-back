import { Router } from "express";
import { restaurantInvitationController } from "../controller/restaurant-invitation.controller.js";
import { checkRole } from "../middleware/check-role.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { validateSendInvitation, validateTokenParam } from "../validation/restaurant-invitation.validation.js";

const router = Router();

// Resatautante envía invitación de ingreso (admin)
router.post("/invite-employee", verifyTokenUser, checkRole(["admin", "owner"]), validateJoi(validateSendInvitation, "body"), restaurantInvitationController.sendInvitationEmployee);

// Validar token (público)
router.get("/validate/:token", validateJoi(validateTokenParam, "params"), restaurantInvitationController.validateToken);

export default router;
