import { Router } from "express";
import { createPaymentIntent, handleWebhook } from "../controller/stripeController.js";
import { verifyTokenOrder } from "../middleware/checkToken.js";
import { apiRateLimitMiddleware } from "../middleware/rateLimiter.js";
import { paymentPerformanceMiddleware } from "../middleware/performanceMiddleware.js";
import express from "express";

const router = Router();

router.post("/create-payment-intent", paymentPerformanceMiddleware, apiRateLimitMiddleware, verifyTokenOrder, createPaymentIntent);
router.post("/webhook", paymentPerformanceMiddleware, handleWebhook);
router.get("/webhook-config", (req, res) => {
    res.json({ 
        webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
        stripeKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
        message: "Configuración del webhook"
    });
});

export default router;