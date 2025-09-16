import { orderService } from "../services/orderService.js";
import { BadRequestError, NotFoundError } from "../utils/customError.js";
import { Request, Response, NextFunction } from "express";
import OrderService from "../services/orderService.js";
import { CreateOrderDto } from "../DTO/orderDto.js";
import { Types } from "mongoose";
import { httpResponse } from "../utils/http-response.js";

class OrderController {

    private service: OrderService;

    constructor(service: OrderService) {
        this.service = service;
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mesaData, user, body, orderId } = req;

            if (!mesaData) throw new NotFoundError("Datos de mesa no encontrados");

            // Si hay orderId del token, agregar items a orden existente
            if (orderId) {
                const updatedOrder = await this.service.addItemsToOrder(orderId, body.items);
                return httpResponse.Ok(res, updatedOrder);
            }

            // Caso normal: crear nueva orden
            const orderData: Partial<CreateOrderDto> = {
                ...body,
                tableId: mesaData.tableId,
                waiterId: mesaData.waiterId,
                restaurant: mesaData.restaurant,
                userName: user ? user.name : body.guestName,
                clientId: user ? new Types.ObjectId(user.id) : undefined,
            };

            const { order, token } = await this.service.create(orderData as any);

            res.cookie("order_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60,
            });
            return httpResponse.Created(res, order);

        } catch (error) {
            next(error);
        }
    };

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
            const restaurant = req.user?.restaurant;
            if (!restaurant) throw new NotFoundError("Datos de restaurante no encontrados")
            if (!id) throw new NotFoundError("Datos de orden no encontrados");
            const response = await this.service.updateStatusOrder(id, req.body, restaurant);

            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    };

    getByRestaurantId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const waiterId = req.user?.id;
            const restaurant = req.user?.restaurant;

            if (!restaurant) throw new NotFoundError("Datos de restaurante no encontrados");
            if (!waiterId) throw new NotFoundError("Datos de mesero no encontrados");

            // 🆕 Extraer filtros de la query
            const { status, fromDate, toDate, waiter, search } = req.query;

            // Validar parámetro waiter
            const validWaiterValues = ["me", "others", "all"];
            const waiterFilter = validWaiterValues.includes(waiter as string)
                ? (waiter as "me" | "others" | "all")
                : "all";

            // Construir filtro de waiter según query
            let waiterParam: string | Types.ObjectId | undefined = undefined;
            if (waiterFilter === "me") {
                waiterParam = waiterId; // solo mis pedidos
            } else if (waiterFilter === "others") {
                waiterParam = "others"; // lógica para que el servicio filtre ≠ waiterId
            } else {
                waiterParam = "all"; // todos
            }

            // Construir filtros solo con valores definidos
            const filters: any = {
                currentWaiterId: waiterId,
            };

            if (status && status !== 'undefined') filters.status = status as string;
            if (fromDate && fromDate !== 'undefined') filters.fromDate = fromDate as string;
            if (toDate && toDate !== 'undefined') filters.toDate = toDate as string;
            if (search && search !== 'undefined' && search !== '') filters.search = search as string;
            if (waiterParam !== undefined && waiterParam !== 'all') filters.waiter = waiterParam;

            console.log('Filtros aplicados:', filters)
            
            const response = await this.service.getByRestaurantId(restaurant, filters);

            return httpResponse.Ok(res, { response, waiterId, restaurant, waiterFilter });
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

    callWaiter = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tableData = req.mesaData;

            if (!tableData) throw new NotFoundError("Datos de mesa no encontrados");

            const response = await this.service.callWaiter(
                tableData.tableId,
                tableData.waiterId,
            );

            return httpResponse.Ok(res, response);
        } catch (error) {
            next(error);
        }
    }



    updateStatusItems = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId, itemId } = req.params
            const { status } = req.body
            const validStatuses = ["pending", "preparing", "ready", "delivered", "cancelled"]
            if (!validStatuses.includes(status)) throw new BadRequestError("Estado inválido")
            if (!orderId || !itemId) throw new NotFoundError("Datos de orden no encontrados")

            const updatedOrder = await this.service.updateStatusItems(itemId, orderId, status)

            return httpResponse.Ok(res, updatedOrder)
        } catch (error) {
            next(error)
        }
    }
}

export const orderController = new OrderController(orderService)