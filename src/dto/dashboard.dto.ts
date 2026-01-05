export interface TopFoodData {
    foodId: string;
    foodName: string;
    quantity: number;
}

export interface CategoryDistribution {
    categoryId: string;
    categoryName: string;
    totalSales: number;
    percentage: number;
}


export type TimeFilter = 'today' | '7days' | '30days' | '6months' | 'all';

export interface EvolutionData {
    x: number;
    label: string;
    orders: number;
    revenue: number;
}

export interface DashboardResponseDto {
    totalOrders: number;
    totalRevenue: number;
    averageTicket: number;
    evolution: EvolutionData[];
    topFoods: TopFoodData[];
    categoryDistribution: CategoryDistribution[];
    waitersRanking: WaiterRankingData[];
}

export interface WaiterRankingData {
    waiterId: string;
    waiterName: string;
    waiterImage?: string;
    totalOrders: number;
    totalRevenue: number;
    averageTicket: number;
}
