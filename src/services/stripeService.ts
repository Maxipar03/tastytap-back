import stripe from "../config/stripe.js";
import { orderService } from "./orderService.js";
import { restaurnatService } from "./restaurantService.js";
import { NotFoundError, CustomError } from "../utils/customError.js";
import logger from "../utils/logger.js";
import { startSession } from "mongoose";
import * as Sentry from "@sentry/node";

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
                amount, // Stripe maneja centavos
                currency: "usd",
                transfer_data: {
                    destination: restaurant.stripeAccountId,
                },
                metadata: {
                    orderId: orderId // Agregar orderId en metadata para el webhook
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
        Sentry.addBreadcrumb({
            category: "webhook",
            message: "Stripe webhook received",
            data: { signatureLength: signature.length }
        });

        logger.info("Webhook recibido de Stripe");

        try {
            const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

            if (!endpointSecret) {
                Sentry.captureMessage("Webhook secret no configurado en variables de entorno", "error");
                throw new CustomError("Webhook secret no configurado", 500);
            }

            let event;
            try {
                event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
            } catch (err: any) {
                logger.error({ error: err.message }, "Error en verificación de firma del webhook");
                throw new CustomError(`Webhook signature verification failed: ${err.message}`, 400);
            }

            Sentry.addBreadcrumb({
                category: "webhook",
                message: "Stripe event processed",
                data: { eventType: event.type, eventId: event.id }
            });

            logger.info({ eventType: event.type, eventId: event.id }, "Procesando evento de Stripe");

            // Manejar el evento de pago exitoso
            if (event.type === 'payment_intent.succeeded') {
                const paymentIntent = event.data.object as any;
                const orderId = paymentIntent.metadata.orderId;
                const paymentIntentId = paymentIntent.id;
                const amount = paymentIntent.amount;

                logger.info({
                    paymentIntentId,
                    orderId,
                    amount
                }, "Pago exitoso - actualizando orden");

                if (orderId) {
                    const session = await startSession();
                    session.startTransaction();

                    try {
                        // Obtener la orden para obtener el restaurant ID
                        const order = await orderService.getById(orderId);
                        if (order) {
                            // Actualizar el estado de la orden a "cashed" con transacción
                            await orderService.updateStatusOrder(orderId, { status: "cashed" }, order.restaurant);
                            await session.commitTransaction();

                            Sentry.captureMessage("Pago completado exitosamente", {
                                level: "info",
                                extra: { orderId, paymentIntentId, amount }
                            });

                            logger.info({
                                orderId,
                                paymentIntentId,
                                restaurantId: order.restaurant
                            }, "Orden marcada como cobrada exitosamente con transacción");
                        } else {
                            await session.abortTransaction();
                            logger.error({ orderId, paymentIntentId }, "Orden no encontrada para webhook");
                            Sentry.captureMessage("Webhook: Orden no encontrada", {
                                level: "error",
                                extra: { orderId, paymentIntentId }
                            });
                        }
                    } catch (error) {
                        await session.abortTransaction();
                        logger.error({ error, orderId, paymentIntentId }, "Error en transacción de pago - rollback ejecutado");
                        throw error;
                    } finally {
                        session.endSession();
                    }
                } else {
                    logger.error({ paymentIntentId }, "OrderId no encontrado en metadata del payment intent");
                    Sentry.captureMessage("Webhook: Orden no encontrada", {
                        level: "error",
                        extra: { orderId, paymentIntentId }
                    });
                }
            } else {
                logger.debug({ eventType: event.type }, "Evento de Stripe no procesado");
            }

        } catch (error) {
            logger.error({ error: error }, "Error procesando webhook de Stripe");
            throw error;
        }
    };
}

export const stripeService = new StripeService();