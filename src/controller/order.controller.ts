import { orderService } from "../service/order.service.js";
import { BadRequestError, NotFoundError, OrderReadyError } from "../utils/custom-error.js";
import { Request, Response, NextFunction } from "express";
import OrderService from "../service/order.service.js";
import { OrderFiltersMapper } from "../dto/order-filters.dto.js";
import { httpResponse } from "../utils/http-response.js";
import { prepareOrderData } from "../utils/orders.js";
import { clearCookieAccess, clearCookieOrder, setCookieOrder } from "../utils/cookies.js";
import logger from "../utils/logger.js";
import { CreateOrderBodyDto, UpdateOrderStatusDto, UpdateItemStatusDto, CreateManualOrderDto } from "../dto/order.dto.js";
import { PaymentMethod } from "../types/order.js";

class OrderController {

    private service: OrderService;

    constructor(service: OrderService) {
        this.service = service;
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tableData, user, orderId, toGoData } = req;
            const body = req.body as CreateOrderBodyDto;

            const logContext = {
                userId: user?.id,
                tableId: tableData?.tableId,
                restaurantId: tableData?.restaurant?.id || toGoData?.restaurant,
                isToGo: !!toGoData,
                itemsCount: body.items?.length
            };
            logger.info(logContext, "Iniciando creación de orden");

            if (tableData) await this.service.validateTableForOrder(tableData.tableId);

            let orderData = prepareOrderData({ 
                body, 
                ...(tableData && { tableData }),
                ...(user && { user }),
                ...(toGoData && { toGoData })
            });

            // Crear la orden y responder con token
            const result = await this.service.create(orderData, orderId as string);
            logger.info({ ...logContext, orderId: result.order?._id, total: result.order.pricing?.total }, "Orden creada exitosamente");

            setCookieOrder(res, result.token)

            return httpResponse.Created(res, result.order);

        } catch (error) {

            logger.error({error}, "Error al crear orden");

            if (error instanceof OrderReadyError) {
                clearCookieOrder(res);
                clearCookieAccess(res);
            }

            next(error);
        }
    }

    selectPayMethod = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const idOrder = req.orderId;
            const { paymentMethod } = req.body;

            if (!idOrder || !paymentMethod) throw new BadRequestError("Datos de orden no encontrados");

            const response = await this.service.selectPayMethod(idOrder, paymentMethod);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    getByTokenUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const idOrder = req.orderId;
            if (!idOrder) throw new NotFoundError("Datos de orden no encontrados");
            const response = await this.service.getById(idOrder);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    updateStatusOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const body = req.body as UpdateOrderStatusDto;
            const { status, deletionReason } = body;
            const restaurant = req.user?.restaurant;
            const waiterId = req.user?.id;

            if (!restaurant || !id ) throw new NotFoundError("Datos de restaurante no encontrados")

            // Validar razón de eliminación si el status es cancelled
            if (status === "cancelled" && (!deletionReason || deletionReason.trim() === "")) throw new BadRequestError("El motivo de cancelación es obligatorio");

            logger.info({ orderId: id, newStatus: status, waiterId, restaurantId: restaurant }, "Actualizando estado de orden");

            const response = await this.service.updateStatusOrder(id, body, restaurant, waiterId);

            logger.info({ orderId: id, waiterId }, "Estado de orden actualizado exitosamente");

            return httpResponse.Ok(res, response);
        } catch (error) {
            logger.error({ orderId: req.params.id, error: error }, "Error al actualizar estado de orden");
            next(error);
        }
    }


    getByRestaurantId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const waiterId = req.user?.id;
            const restaurant = req.user?.restaurant;

            if (!restaurant) throw new NotFoundError("Datos de restaurante no encontrados");
            if (!waiterId) throw new NotFoundError("Datos de mesero no encontrados");

            const filters = OrderFiltersMapper.mapFromQuery(req.query, waiterId.toString());

            const response = await this.service.getByRestaurantId(restaurant, filters);

            return httpResponse.Ok(res, {
                orders: response?.docs || [],
                pagination: {
                    totalDocs: response?.totalDocs || 0,
                    limit: response?.limit || 5,
                    totalPages: response?.totalPages || 0,
                    page: response?.page || 1,
                    pagingCounter: response?.pagingCounter || 0,
                    hasPrevPage: response?.hasPrevPage || false,
                    hasNextPage: response?.hasNextPage || false,
                    prevPage: response?.prevPage || null,
                    nextPage: response?.nextPage || null
                },
                waiterId,
                restaurant
            });
        } catch (error) {
            next(error);
        }
    };

    getOrdersByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
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

    getByUserId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new NotFoundError("Datos de usuario no encontrados");
            const response = await this.service.getByUserId(userId);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    updateStatusItems = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId, itemId } = req.params;
            const { status, deletionReason } = req.body as UpdateItemStatusDto;
            
            if (!orderId || !itemId) throw new NotFoundError("Datos de orden no encontrados");

            // Validar razón de eliminación si el status es cancelled
            if (status === "cancelled" && (!deletionReason || deletionReason.trim() === "")) throw new BadRequestError("La razón de eliminación es obligatoria");

            const updatedOrder = await this.service.updateStatusItems(orderId, itemId, status, deletionReason)

            return httpResponse.Ok(res, updatedOrder)
        } catch (error) {
            next(error)
        }
    }

    validate = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.orderId) return httpResponse.NoContent(res)
        return httpResponse.Ok(res, req.orderId);
    }

    getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("ID de orden no encontrado");

            const response = await this.service.getById(id, true);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    createManualOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.body as CreateManualOrderDto;
            const { items, tableId } = body;
            const restaurant = req.user?.restaurant;
            const waiterId = req.user?.id;

            if (!restaurant) throw new BadRequestError("No se encontró el restaurante del usuario");
            if (!tableId) throw new BadRequestError("El ID de la mesa es requerido");
            if (!items || items.length === 0) throw new BadRequestError("Debe incluir al menos un item");

            const tableData = {
                tableId,
                waiterId,
                restaurant: { id: restaurant }
            };

            const orderData = prepareOrderData({
                body: body as any,
                tableData: tableData as any
            });

            orderData.manual = true;
            orderData.paymentMethod = "cash";

            const result = await this.service.create(orderData, "");
            return httpResponse.Created(res, result.order);
        } catch (error) {
            next(error);
        }
    }
}

export const orderController = new OrderController(orderService)