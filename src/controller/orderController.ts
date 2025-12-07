import { orderService } from "../services/orderService.js";
import { BadRequestError, NotFoundError, OrderReadyError } from "../utils/customError.js";
import { Request, Response, NextFunction } from "express";
import OrderService from "../services/orderService.js";
import { CreateOrderDto } from "../DTO/orderDto.js";
import { OrderFiltersMapper } from "../DTO/orderFiltersDto.js";
import { httpResponse } from "../utils/http-response.js";
import { tableServices } from "../services/tableService.js";
import { prepareOrderData } from "../utils/ordersUtils.js";
import { clearCookieAccess, clearCookieOrder, setCookieOrder } from "../utils/cookies.js";
import logger from "../utils/logger.js";

class OrderController {

    private service: OrderService;

    constructor(service: OrderService) {
        this.service = service;
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tableData, user, body, orderId, toGoData } = req;

            const logContext = {
                userId: user?.id,
                tableId: tableData?.tableId,
                restaurantId: tableData?.restaurant?.id || toGoData?.restaurant,
                isToGo: !!toGoData,
                itemsCount: body.items?.length
            };

            logger.info(logContext, "Iniciando creación de orden");

            let orderData = prepareOrderData({ body, tableData, user, toGoData });

            // Verifica si la mesa de la orden esta disponible (Debe estar ocupada)
            if (!toGoData && tableData) {
                const tables = await tableServices.getByRestaurat(tableData.restaurant.id);
                const currentTable = tables.find((t) => t._id.toString() === tableData.tableId.toString());
                if (currentTable && currentTable.state === "available") {
                    logger.warn({ ...logContext, tableState: currentTable.state }, "Intento de crear orden en mesa disponible");
                    throw new BadRequestError("No se puede crear una orden en una mesa disponible");
                }
            }

            // Crear la orden y responder con token
            const result = await this.service.create(orderData, orderId as string);

            logger.info({ ...logContext, orderId: result.order?._id, total: result.order.pricing?.total }, "Orden creada exitosamente");

            setCookieOrder(res, result.token)

            return httpResponse.Created(res, result.order);

        } catch (error) {
            const logContext = {
                userId: req.user?.id,
                tableId: req.tableData?.tableId,
                restaurantId: req.tableData?.restaurant?.id || req.toGoData?.restaurant,
                error: error
            };

            logger.error(logContext, "Error al crear orden");

            if (error instanceof OrderReadyError) {
                clearCookieOrder(res);
                clearCookieAccess(res);
            }

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
            const { status, deletionReason } = req.body;
            const restaurant = req.user?.restaurant;
            const waiterId = req.user?.id;

            if (!restaurant) throw new NotFoundError("Datos de restaurante no encontrados")
            if (!id) throw new NotFoundError("Datos de orden no encontrados");
            if (status === "cancelled" && (!deletionReason || deletionReason.trim() === "")) throw new BadRequestError("El motivo de cancelación es obligatorio");

            logger.info({ orderId: id, newStatus: status, waiterId, restaurantId: restaurant }, "Actualizando estado de orden");

            const response = await this.service.updateStatusOrder(id, req.body, restaurant, waiterId);

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

    // callWaiter = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const tableData = req.tableData;

    //         if (!tableData) throw new NotFoundError("Datos de mesa no encontrados");

    //         const response = await this.service.callWaiter(
    //             tableData.tableId,
    //             tableData.waiterId,
    //         );

    //         return httpResponse.Ok(res, response);
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    updateStatusItems = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId, itemId } = req.params
            const { status, deletionReason } = req.body
            if (!orderId || !itemId) throw new NotFoundError("Datos de orden no encontrados")

            // Validar razón de eliminación si el status es cancelled
            if (status === "cancelled" && (!deletionReason || deletionReason.trim() === "")) throw new BadRequestError("La razón de eliminación es obligatoria");

            // orderId del parámetro es realmente el itemId, itemId del parámetro es realmente el orderId
            const updatedOrder = await this.service.updateStatusItems(orderId, itemId, status, deletionReason)

            return httpResponse.Ok(res, updatedOrder)
        } catch (error) {
            next(error)
        }
    }

    deleteItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId, itemId } = req.params
            const { deletionReason } = req.body

            if (!orderId || !itemId) throw new NotFoundError("Datos de orden no encontrados")
            if (!deletionReason || deletionReason.trim() === "") throw new BadRequestError("La razón de eliminación es obligatoria")

            const updatedOrder = await this.service.updateStatusItems(orderId, itemId, "cancelled", deletionReason)
            return httpResponse.Ok(res, updatedOrder)
        } catch (error) {
            next(error)
        }
    }

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

    validate = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.orderId) return httpResponse.NoContent(res)
        return httpResponse.Ok(res, req.orderId);
    }

    getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("ID de orden no encontrado");
            console.log(id)

            const response = await this.service.getById(id, true);
            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    createManualOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { items, guestName, tableId, pricing } = req.body;
            const restaurant = req.user?.restaurant;
            const waiterId = req.user?.id;

            if (!restaurant) throw new BadRequestError("No se encontró el restaurante del usuario");
            if (!tableId) throw new BadRequestError("El ID de la mesa es requerido");
            if (!items || items.length === 0) throw new BadRequestError("Debe incluir al menos un item");
            if (!pricing) throw new BadRequestError("El pricing es requerido");

            const orderData: CreateOrderDto = {
                items,
                tableId,
                restaurant,
                waiterId,
                userName: guestName || "Cliente",
                status: "pending",
                pricing,
                manual: true,
                orderType: "dine-in",
                paymentMethod: "cash",
                isPaid: false
            };

            const result = await this.service.create(orderData, "");
            return httpResponse.Created(res, result.order);
        } catch (error) {
            next(error);
        }
    }
}

export const orderController = new OrderController(orderService)