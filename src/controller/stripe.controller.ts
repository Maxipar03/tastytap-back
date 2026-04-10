import { Request, Response, NextFunction } from "express";
import StripeService, { stripeService } from "../service/stripe.service.js";
import { BadRequestError } from "../utils/custom-error.utils.js";
import logger from "../config/logger.config.js";

class StripeController {

    private service: StripeService;

    constructor(services: StripeService) {
        this.service = services;
    }

    handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            logger.warn({ ip: req.ip }, "Webhook de Stripe sin firma");
            throw new BadRequestError("No se encontro la firma del header");
        }

        try {
            logger.info({
                signature: signature.substring(0, 20) + '...',
                bodySize: req.body.length,
                contentType: req.headers['content-type']
            }, "Procesando webhook de Stripe");

            await this.service.handleWebhook(req.body, signature);

            logger.info("Webhook de Stripe procesado exitosamente");
            return res.status(200).send('OK');
        } catch (error) {
            logger.error({ error: error, signature: signature.substring(0, 20) + '...' }, "Error al procesar webhook de Stripe");
            next(error);
        }
    }
}

export const stripeController = new StripeController(stripeService)
