import { Router } from "express";
import { invitationController } from "../controller/invitation.controller.js";
import { checkRole } from "../middleware/role.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validator.middleware.js";
import { validateSendInvitation, validateTokenParam } from "../validation/invitation.validation.js";

const router = Router();

// Restaurante envía invitación de ingreso de nuevo empleado
router.post(
    "/", 
    authenticate, 
    checkRole(["admin", "owner"]), 
    validateRequest(validateSendInvitation, "body"), 
    invitationController.createInvitation
);

// Validar token de invitación para registro de nuevo empleado
router.get(
    "/validate/:token", 
    validateRequest(validateTokenParam, "params"), 
    invitationController.verifyInvitationToken
);

export default router;
