import stripe from "../config/stripe.config.js";
import { orderService } from "./order.service.js";
import { restaurnatService } from "./restaurant.service.js";
import { NotFoundError, CustomError } from "../utils/custom-error.utils.js";
import logger from "../config/logger.config.js";
import * as Sentry from "@sentry/node";
import Stripe from "stripe";
import { withTransaction } from "../utils/transaction.utils.js";

export default class StripeService {

    createPaymentIntent = async (orderId: string) => {
        try {
            Sentry.addBreadcrumb({
                category: "payment",
                message: "Iniciando creación de Payment Intent",
                data: { orderId }
            });

            logger.info({ orderId }, "Iniciando creación de payment intent");

            // Obtener la orden por ID
            const order = await orderService.getById(orderId);

            if (!order) {
                logger.error({ orderId }, "Orden no encontrada para payment intent");
                throw new NotFoundError("No se encontró la orden");
            }

            if (order.paymentMethod !== "CARD") {
                logger.error({ orderId }, "Método de pago no compatible con Stripe");
                throw new CustomError("El método de pago no es compatible con Stripe", 400);
            };

            // Obtener el restaurante
            const restaurant = await restaurnatService.getById(order.restaurant.toString());
            if (!restaurant) {
                logger.error({ orderId, restaurantId: order.restaurant }, "Restaurante no encontrado para payment intent");
                throw new NotFoundError("No se encontró el restaurante");
            }

            if (!restaurant.stripeAccountId) {
                logger.error({ orderId, restaurantId: restaurant._id }, "Restaurante sin cuenta de Stripe configurada");
                Sentry.captureMessage(`Restaurante sin cuenta Stripe: ${restaurant.name}`, "warning");
                throw new CustomError("El restaurante no tiene configurado Stripe", 400);
            }

            const amount = Math.round(order.pricing.total * 100);

            logger.info({
                orderId,
                restaurantId: restaurant._id,
                amount: order.pricing.total,
                stripeAmount: amount
            }, "Creando payment intent en Stripe");

            // Crear el payment intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: "usd",
                transfer_data: {
                    destination: restaurant.stripeAccountId,
                },
                metadata: {
                    orderId: orderId 
                }
            });

            Sentry.captureMessage("Payment Intent Creado", {
                level: "info",
                extra: {
                    orderId,
                    paymentIntentId: paymentIntent.id,
                    amount: order.pricing.total
                }
            });

            logger.info({
                orderId,
                paymentIntentId: paymentIntent.id,
                restaurantId: restaurant._id,
                amount: order.pricing.total
            }, "Payment intent creado exitosamente");

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: order.pricing.total,
                restaurant: {
                    id: restaurant._id,
                    name: restaurant.name
                }
            };

        } catch (error) {
            throw error;
        }
    };

    handleWebhook = async (body: Buffer, signature: string) => {
        logger.info("Webhook recibido de Stripe");

        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!endpointSecret) {
            throw new CustomError("Webhook secret no configurado", 500);
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
        } catch (err: any) {
            logger.error({ error: err.message }, "Error en verificación de firma del webhook");
            throw new CustomError(`Webhook signature verification failed: ${err.message}`, 400);
        }

        logger.info({
            eventType: event.type,
            eventId: event.id
        }, "Evento Stripe recibido");

        switch (event.type) {

            // 💳 PAGOS
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const orderId = paymentIntent.metadata?.orderId?.trim();

                if (!orderId) {
                    logger.error({ paymentIntentId: paymentIntent.id }, "OrderId faltante en metadata");
                    return;
                }

                const maxRetries = 3;
                let attempt = 0;

                while (attempt < maxRetries) {
                    attempt++;

                    try {
                        await withTransaction(async (session) => {
                            const order = await orderService.getById(orderId);
                            if (!order || order.paymentStatus === "PAID") return;

                            await orderService.updateStatusOrder(
                                orderId,
                                "PAID",
                                order.restaurant.toString(),
                                session
                            );

                            logger.info({ orderId }, "Orden marcada como pagada");
                        });

                        break;
                    } catch (error: any) {
                        if (error.code !== 112 || attempt >= maxRetries) {
                            throw error;
                        }
                        await new Promise(r => setTimeout(r, 100 * attempt));
                    }
                }

                break;
            }

            // 🏦 STRIPE CONNECT – ONBOARDING
            case "account.updated": {
                const account = event.data.object as Stripe.Account;

                const completed =
                    account.details_submitted &&
                    account.charges_enabled &&
                    account.payouts_enabled;

                logger.info({
                    stripeAccountId: account.id,
                    completed,
                    charges_enabled: account.charges_enabled,
                    payouts_enabled: account.payouts_enabled
                }, "Actualización de cuenta Stripe");

                if (completed) {
                    await restaurnatService.updateByStripeAccountId(account.id, {
                        stripeStatus: "ACTIVE"
                    });

                    logger.info({
                        stripeAccountId: account.id
                    }, "Stripe onboarding completado automáticamente");
                }

                break;
            }

            default:
                logger.debug({
                    eventType: event.type
                }, "Evento Stripe ignorado");
        }
    };
}

export const stripeService = new StripeService();