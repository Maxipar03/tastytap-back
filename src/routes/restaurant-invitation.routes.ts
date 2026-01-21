import { Router } from "express";
import multer from "multer";
import { restaurantInvitationController } from "../controller/restaurant-invitation.controller.js";
import { checkRole } from "../middleware/check-role.js";
import { verifyTokenUser } from "../middleware/check-token.js";
import { validateJoi } from "../middleware/validate-joi.js";
import { validateSendInvitationAdmin, validateTokenParam, validateOnboardingRestaurant } from "../validation/restaurant-invitation.validation.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Admin envía invitación de creacion
router.post("/invite-admin", verifyTokenUser, checkRole("admin"), validateJoi(validateSendInvitationAdmin, "body"), restaurantInvitationController.sendInvitationAdmin);

// Resatautante envía invitación de ingreso (admin)
router.post("/invite-employee", verifyTokenUser, checkRole("admin"), restaurantInvitationController.sendInvitationEmployee);

// Validar token (público)
router.get("/validate/:token", validateJoi(validateTokenParam, "params"), restaurantInvitationController.validateToken);

// Crear restaurante con token (público)
router.post("/create/:token", verifyTokenUser, validateJoi(validateTokenParam, "params"), upload.single('logo'), restaurantInvitationController.createRestaurant);

export default router;
