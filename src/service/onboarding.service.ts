import { Types } from "mongoose";
import { onboardingMongoDao } from "../dao/mongodb/onboarding.dao.js";
import { OnboardingDao, OnboardingDB } from "../types/onboarding.types.js";
import { BadRequestError } from "../utils/custom-error.utils.js";
import { OrderModel } from "../dao/mongodb/models/order.model.js";
import { FoodModel } from "../dao/mongodb/models/food.model.js";
import { RestaurantModel } from "../dao/mongodb/models/restaurant.model.js";

export default class OnboardingServices {
    private dao: OnboardingDao;

    constructor(dao: OnboardingDao) {
        this.dao = dao;
    }

    createOnboarding = async (id: Types.ObjectId, body: any): Promise<OnboardingDB> => {
        return await this.dao.create({ ...body, user: id, statusRequest: "PENDING" });
    };

    approveOnboarding = async (id: string): Promise<OnboardingDB | null> => {
        const data = await this.dao.update(id, { statusRequest: "APPROVED" });
        if (!data) throw new BadRequestError("No se aprovar el restaurante")
        await this.dao.create({ name: data?.restaurantName, address: data?.address, user: data?.user });
        return data;
    };

    homeData = async (restaurantId: string | Types.ObjectId): Promise<any> => {
        // 1. Asegurar ObjectId real
        const rId = new Types.ObjectId(restaurantId.toString());

        // 2. Configurar rangos de fechas
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        const yesterdayEnd = new Date(todayStart); // Ayer termina justo cuando empieza hoy

        const [
            ordersAggregation,
            activeMenuItems,
            recentOrders,
            restaurantInfo
        ] = await Promise.all([

            // A. AGREGACIÓN (Centralizada para optimizar lecturas de órdenes)
            OrderModel.aggregate([
                { $match: { restaurant: rId, status: { $ne: 'DRAFT' } } }, // Filtro base general
                {
                    $facet: {
                        todayStats: [
                            { $match: { createdAt: { $gte: todayStart } } },
                            {
                                $group: {
                                    _id: null,
                                    todayOrders: { $sum: 1 },
                                    todayRevenue: { $sum: "$pricing.total" }
                                }
                            }
                        ],
                        yesterdayStats: [
                            {
                                $match: {
                                    createdAt: {
                                        $gte: yesterdayStart,
                                        $lt: yesterdayEnd
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    yesterdayOrders: { $sum: 1 },
                                    yesterdayRevenue: { $sum: "$pricing.total" }
                                }
                            }
                        ],
                        pendingOrders: [
                            { $match: { status: 'PENDING' } },
                            { $count: "count" }
                        ],
                        topSellingItems: [
                            { $unwind: "$items" },
                            {
                                $group: {
                                    _id: "$items.foodId",
                                    name: { $first: "$items.foodName" },
                                    totalQuantity: { $sum: "$items.quantity" }
                                }
                            },
                            { $sort: { totalQuantity: -1 } },
                            { $limit: 5 }
                        ]
                    }
                }
            ]),

            // B. Conteo de stock agotado
            FoodModel.countDocuments({
                restaurant: rId,
                stock: { $gte: 0 }
            }),

            // C. Últimas órdenes
            OrderModel.find({
                restaurant: rId,
                status: { $ne: 'DRAFT' }
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('createdAt pricing status items userName')
                .lean(),

            // E. Info del restaurante
            RestaurantModel.findById(rId).select('rating').lean(),
        ]);

        const statsResult = ordersAggregation[0];

        // Extraer datos limpios de hoy y ayer
        const today = statsResult?.todayStats[0] || { todayOrders: 0, todayRevenue: 0 };
        const yesterday = statsResult?.yesterdayStats[0] || { yesterdayOrders: 0, yesterdayRevenue: 0 };

        // 3. Calcular diferencias numéricas y porcentuales
        const revenueDifference = today.todayRevenue - yesterday.yesterdayRevenue;
        const ordersDifference = today.todayOrders - yesterday.yesterdayOrders;

        // Opcional: Porcentajes de crecimiento (evitando división por cero)
        const revenuePercentageChange = yesterday.yesterdayRevenue > 0
            ? (revenueDifference / yesterday.yesterdayRevenue) * 100
            : 0;

        const ordersPercentageChange = yesterday.yesterdayOrders > 0
            ? (ordersDifference / yesterday.yesterdayOrders) * 100
            : 0;

        return {
            stats: {
                todayOrders: today.todayOrders,
                todayRevenue: today.todayRevenue,
                averageRating: restaurantInfo?.rating || 0,
                activeMenuItems,
                pendingOrders: statsResult?.pendingOrders[0]?.count || 0,
                comparison: {
                    revenue: {
                        diff: revenueDifference,
                        percentage: Math.round(revenuePercentageChange),
                        rawYesterday: yesterday.yesterdayRevenue
                    },
                    orders: {
                        diff: ordersDifference,
                        percentage: Math.round(ordersPercentageChange),
                        rawYesterday: yesterday.yesterdayOrders
                    }
                }
            },
            topSellingItems: statsResult?.topSellingItems || [],
            recentOrders,
        };
    }

    rejectOnboarding = async (id: string): Promise<OnboardingDB | null> => {
        return await this.dao.update(id, { statusRequest: "REJECTED" });
    };

}

export const onboardingServices = new OnboardingServices(onboardingMongoDao);
