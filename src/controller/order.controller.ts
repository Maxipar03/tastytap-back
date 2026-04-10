import { orderService } from "../service/order.service.js";
import { OrderService } from "../types/order.types.js";
import { v4 as uuidv4 } from 'uuid';
import { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../utils/custom-error.utils.js";
import { Request, Response, NextFunction } from "express";
import { OrderFiltersMapper } from "../dto/order-filters.dto.js";
import { httpResponse } from "../utils/response.utils.js";
import { setCookieSession } from "../utils/cookies.utils.js";
import logger from "../config/logger.config.js";
import { sendReceiptEmail } from "../utils/email.utils.js";
import { CreateOrderBodyDto, UpdateItemStatusDto, UpdateOrderBody } from "../dto/order.dto.js";

class OrderController {

    private service: OrderService;

    constructor(service: OrderService) {
        this.service = service;
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {

            const sessionId = req.cookies['session_id'] || uuidv4();

            const user = req.user;
            const { items, pricing, paymentMethod, restaurant, guestName } = req.body as CreateOrderBodyDto;

            const logContext = {
                user: user?.id,
                itemsCount: items.length
            };

            logger.info(logContext, "Iniciando creación de orden");

            if (!guestName) throw new BadRequestError("Datos de usuario no encontrados");

            const result = await this.service.create({
                items: items,
                pricing: pricing,
                paymentMethod: paymentMethod,
                guestId: sessionId,
                restaurant: restaurant.id,
                userName: guestName,
                clientId: user ? new Types.ObjectId(user.id) : undefined,
                paymentStatus: "PENDING"
            });

            logger.info({ ...logContext, orderId: result.order?._id, total: result.order.pricing?.total }, "Orden creada exitosamente");

            if (!req.cookies['session_id']) setCookieSession(res, sessionId);
            return httpResponse.Created(res, result);

        } catch (error) {
            logger.error({ error }, "Error al crear orden");
            next(error);
        }
    }

    getOrdersGuest = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const sessionId = req.cookies['session_id'] as string;
            if (!sessionId) throw new BadRequestError("Guest ID es requerido");

            const response = await this.service.getOrdersGuest(sessionId);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    sendReceipt = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const orderId = req.orderId;
            const user = req.user;
            const { email } = req.body;

            if (!orderId) throw new NotFoundError("Datos de orden no encontrados");
            if (!user && !email) throw new BadRequestError("Email requerido");

            const order = await this.service.getById(orderId);
            if (!order) throw new NotFoundError("Orden no encontrada");

            const recipientEmail = email || user?.email;
            if (!recipientEmail) throw new BadRequestError("Email no disponible");

            await sendReceiptEmail(recipientEmail, order);
            return httpResponse.Ok(res, { message: "Recibo enviado exitosamente" });
        } catch (error) {
            next(error);
        }
    }

    updateStatusOrder = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { id } = req.params;
            const { paymentStatus } = req.body as UpdateOrderBody;
            const restaurant = req.user?.restaurant;

            if (!restaurant || !id) throw new NotFoundError("Datos de restaurante no encontrados");
            logger.info({ orderId: id, newStatus: paymentStatus, restaurantId: restaurant }, "Actualizando estado de orden");

            const response = await this.service.updateStatusOrder(id, paymentStatus, restaurant);

            logger.info({ orderId: id }, "Estado de orden actualizado exitosamente");

            return httpResponse.Ok(res, response);
        } catch (error) {
            logger.error({ orderId: req.params.id, error: error }, "Error al actualizar estado de orden");
            next(error);
        }
    }


    getOrdersPaginated = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const waiterId = req.user?.id;
            const restaurant = req.user?.restaurant;
            if (!restaurant) throw new NotFoundError("Datos de restaurante no encontrados");
            if (!waiterId) throw new NotFoundError("Datos de mesero no encontrados");

            const filters = OrderFiltersMapper.mapFromQuery(req.query, waiterId.toString());

            const response = await this.service.getByRestaurantId(restaurant, filters);

            return httpResponse.Ok(res, {
                orders: response?.docs || [],
                response,
                waiterId,
                restaurant
            });
        } catch (error) {
            next(error);
        }
    };

    getActiveOrders = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const restaurant = req.user?.restaurant;
            if (!restaurant) throw new NotFoundError("Datos de restaurante no encontrados");

            const response = await this.service.getByRestaurantId(restaurant, {});

            logger.debug({ restaurantId: restaurant, ordersCount: response?.docs?.length }, "Obteniendo órdenes por restaurante");
            return httpResponse.Ok(res, response?.docs || []);
        } catch (error) {
            next(error);
        }
    };

    updateStatusItems = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { orderId, itemId } = req.params;
            const { status } = req.body as UpdateItemStatusDto;

            if (!orderId || !itemId) throw new NotFoundError("Datos de orden no encontrados");

            const updatedOrder = await this.service.updateStatusItems(orderId, itemId, status)

            return httpResponse.Ok(res, updatedOrder)
        } catch (error) {
            next(error)
        }
    }

    getOrderDetails = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("ID de orden no encontrado");

            const response = await this.service.getById(id, true);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    checkout = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        try {
            const orderId = req.params.id;
            const sessionId = req.cookies['session_id'];

            if (!orderId) throw new NotFoundError("ID de orden no encontrado");
            if (!sessionId) throw new BadRequestError("Guest ID es requerido");

            const order = await this.service.getById(orderId);
            if (!order) throw new NotFoundError("Orden no encontrada");
            if (order.guestId !== sessionId) throw new BadRequestError("No autorizado para acceder a esta orden");

            return httpResponse.Ok(res, order);

        } catch (error) {
            next(error);
        }
    }
}

export const orderController = new OrderController(orderService);