import { Request, Response, NextFunction } from "express";
import { stripeService } from "../services/stripeService.js";
import { HttpResponse } from "../utils/http-response.js";
import { BadRequestError } from "../utils/customError.js";
import * as Sentry from "@sentry/node";
import logger from "../utils/logger.js";
const httpResponse = new HttpResponse();

export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req;
        const userId = req.user?.id;
        
        if (!orderId) {
            logger.warn({ userId }, "Intento de crear payment intent sin orderId");
            throw new BadRequestError( "No se encontró el ID de la orden");
        }
        
        Sentry.setContext('payment_intent_data', { orderId, userId });
        logger.info({ orderId, userId }, "Creando payment intent");
    
        const paymentData = await stripeService.createPaymentIntent(orderId);
        
        logger.info({ 
            orderId, 
            userId, 
            paymentIntentId: paymentData.paymentIntentId,
            amount: paymentData.amount 
        }, "Payment intent creado exitosamente");
        
        return httpResponse.Ok(res, paymentData);
    } catch (error) {
        logger.error({ orderId: req.orderId, error: error }, "Error al crear payment intent");
        next(error);
    }
}

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
        logger.warn({ ip: req.ip }, "Webhook de Stripe sin firma");
        throw new BadRequestError("No se encontro la firma del header");
    }

    try {
        logger.info({ signature: signature.substring(0, 20) + '...' }, "Procesando webhook de Stripe");
        
        await stripeService.handleWebhook(req.body, signature);
        
        logger.info("Webhook de Stripe procesado exitosamente");
        return res.status(200).send('OK');
    } catch (error) {
        logger.error({ error: error, signature: signature.substring(0, 20) + '...' }, "Error al procesar webhook de Stripe");
        next(error);
    }
}