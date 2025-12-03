import { orderMongoDao } from "../daos/mongodb/orderDao.js";
import { DashboardResponseDto, TopFoodData, CategoryDistribution, TimeFilter, EvolutionData, WaiterRankingData } from "../DTO/dashboardDto.js";
import { Types } from "mongoose";

export default class DashboardService {

    private getDateFilter(timeFilter: string): Date | null {
        const now = new Date();
        switch (timeFilter) {
            case 'today':
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return today;
            case '7d':
                const sevenDays = new Date();
                sevenDays.setDate(now.getDate() - 7);
                sevenDays.setHours(0, 0, 0, 0);
                return sevenDays;
            case '30d':
                const thirtyDays = new Date();
                thirtyDays.setDate(now.getDate() - 30);
                thirtyDays.setHours(0, 0, 0, 0);
                return thirtyDays;
            case '6m':
                const sixMonths = new Date();
                sixMonths.setMonth(now.getMonth() - 6);
                sixMonths.setHours(0, 0, 0, 0);
                return sixMonths;
            default:
                return null;
        }
    }

    private getEvolutionFormat(timeFilter: string): string {
        switch (timeFilter) {
            case 'today': return '%Y-%m-%d %H:00';
            case '7d': return '%Y-%m-%d';
            case '30d': return '%Y-%m-%d';
            case '6mo': return '%Y-%m';
            default: return '%Y-%m';
        }
    }

    getDashboardData = async (restaurantId: string | Types.ObjectId, timeFilter: string = 'all'): Promise<DashboardResponseDto> => {
        const dateFilter = this.getDateFilter(timeFilter);
        const evolutionFormat = this.getEvolutionFormat(timeFilter);

        const [totalStats, topFoodsAggregation, categoryDistribution, evolutionData, waitersRanking] = await Promise.all([
            orderMongoDao.getTotalStats(restaurantId, dateFilter),
            orderMongoDao.getTopSellingFoods(restaurantId, dateFilter),
            orderMongoDao.getCategoryDistribution(restaurantId, dateFilter),
            orderMongoDao.getEvolutionData(restaurantId, dateFilter, evolutionFormat),
            orderMongoDao.getWaitersRanking(restaurantId, dateFilter)
        ]);


        const topFoodsData: TopFoodData[] = topFoodsAggregation.map((item: any) => ({
            foodId: item._id.toString(),
            foodName: item.foodName, 
            quantity: item.quantity
        }));


        const categoryDistributionData: CategoryDistribution[] = categoryDistribution.map((item: any) => ({
            categoryId: item._id?.toString() || 'sin-categoria',
            categoryName: item.categoryName || 'Sin categoría',
            totalSales: Math.round(item.totalSales * 100) / 100,
            percentage: item.percentage
        }));

        const averageTicket = totalStats.totalOrders > 0 
            ? Math.round((totalStats.totalRevenue / totalStats.totalOrders) * 100) / 100 
            : 0;

        const evolution: EvolutionData[] = evolutionData.map((item: any, index: number) => ({
            x: index,
            label: item._id,
            orders: item.orders,
            revenue: Math.round(item.revenue * 100) / 100
        }));


        const waitersRankingData: WaiterRankingData[] = waitersRanking.map((waiter: any) => ({
            waiterId: waiter._id.toString(),
            waiterName: waiter.waiterName,
            waiterImage: waiter.waiterImage,
            totalOrders: waiter.totalOrders,
            totalRevenue: Math.round(waiter.totalRevenue * 100) / 100,
            averageTicket: waiter.totalOrders > 0 ? Math.round((waiter.totalRevenue / waiter.totalOrders) * 100) / 100 : 0
        }));

        return {
            totalOrders: totalStats.totalOrders,
            totalRevenue: Math.round(totalStats.totalRevenue * 100) / 100,
            averageTicket,
            evolution,
            topFoods: topFoodsData,
            categoryDistribution: categoryDistributionData,
            waitersRanking: waitersRankingData
        };
    }
}

export const dashboardService = new DashboardService();
