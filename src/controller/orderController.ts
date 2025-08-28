import { orderService } from "../services/orderService.js";
import { seatMogoDao } from "../daos/mongodb/seatDao.js";
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

            if (!req.mesaData) throw new NotFoundError("Datos de mesa no encontrados");
            const mesaData = req.mesaData;

            console.log(mesaData)

            const token = req.cookies.seat_token
            if (!token) throw new NotFoundError("Token de mesa no encontrado");

            const seat = await seatMogoDao.findOne({ sessionToken: token });
            if (!seat) throw new NotFoundError("Mesa no encontrada");

            const orderData: Partial<CreateOrderDto> = {
                ...req.body,
                tableId: mesaData.tableId,
                waiterId: mesaData.waiterId,
                restaurant: mesaData.restaurant,
                seatId: seat._id,
            };

            if (req.user) {
                orderData.clientId = new Types.ObjectId(req.user.id);
                orderData.userName = req.user.name;
            } else {
                if (!seat.guestName) throw new NotFoundError("Nombre de invitado no encontrado");
                orderData.userName = seat.guestName;
            }

            const response = await this.service.create(orderData as CreateOrderDto);
            return httpResponse.Created(res, response)
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            if (!id) throw new NotFoundError("Datos de orden no encontrados");
            const response = await this.service.update(id, req.body);

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
            let waiterParam: string | Types.ObjectId |undefined = undefined;
            if (waiterFilter === "me") {
                waiterParam = waiterId; // solo mis pedidos
            } else if (waiterFilter === "others") {
                waiterParam = "others"; // lógica para que el servicio filtre ≠ waiterId
            } else {
                waiterParam = "all"; // todos
            }

            // Llamar al servicio
            const filters: any = {
                status: status as string,
                fromDate: fromDate as string,
                toDate: toDate as string,
                currentWaiterId: waiterId,
                search: search as string,
            };
            
            if (waiterParam !== undefined) {
                filters.waiter = waiterParam;
            }
            
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

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId, itemId } = req.params
            const { status } = req.body
            const validStatuses = ["pending", "preparing", "ready", "delivered", "cancelled"]
            if (!validStatuses.includes(status)) throw new BadRequestError("Estado inválido")
            if (!orderId || !itemId) throw new NotFoundError("Datos de orden no encontrados")

            const updatedOrder = await this.service.updateStatus(itemId, orderId, status)

            return httpResponse.Ok(res, updatedOrder)
        } catch (error) {
            next(error)
        }
    }
}

export const orderController = new OrderController(orderService)