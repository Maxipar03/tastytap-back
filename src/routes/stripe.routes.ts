import { Router } from "express";
import { stripeController } from "../controller/stripe.controller.js";
import { monitorPaymentSentry } from "../middleware/sentry.middleware.js";

const router = Router();

router.post(
    "/webhook",
    monitorPaymentSentry, 
    stripeController.handleWebhook
);

export default router;