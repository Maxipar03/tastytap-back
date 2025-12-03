import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboardService.js";
import { httpResponse } from "../utils/http-response.js";

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurantId = req.user?.restaurant;
        const timeFilter = (req.query.days as string) || 'all';

        if (!restaurantId) return httpResponse.Unauthorized(res, "No autorizado");

        const data = await dashboardService.getDashboardData(restaurantId, timeFilter);
        return httpResponse.Ok(res, data);
    } catch (error) {
        next(error);
    }
};
