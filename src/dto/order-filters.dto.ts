export interface OrderFiltersDto {
    fromDate: string;
    toDate: string;
    search?: string;
    page?: number;
    limit?: number;
}

export class OrderFiltersMapper {
    public static mapFromQuery(query: any): OrderFiltersDto {
        const filters: Partial<OrderFiltersDto> = {};

        if (query.search && query.search !== 'undefined' && query.search !== '') {
            filters.search = query.search as string;
        }

        let targetDate: Date;

        if (query.date && query.date !== 'undefined' && query.date !== '' && query.date !== 'null') {
            targetDate = new Date(query.date);
        } else {
            targetDate = new Date();
        }

        console.log("targetDate", targetDate);

        // Obtener el inicio del día en UTC (00:00:00.000)
        const startOfDay = new Date(Date.UTC(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth(),
            targetDate.getUTCDate(),
            0, 0, 0, 0
        ));
        filters.fromDate = startOfDay.toISOString();

        // Obtener el fin del día en UTC (23:59:59.999)
        const endOfDay = new Date(Date.UTC(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth(),
            targetDate.getUTCDate(),
            23, 59, 59, 999
        ));
        filters.toDate = endOfDay.toISOString();

        console.log("filtros", startOfDay, endOfDay)

        if (query.page && !isNaN(Number(query.page))) filters.page = Number(query.page);
        if (query.limit && !isNaN(Number(query.limit))) filters.limit = Number(query.limit);

        return {
            ...filters,
            fromDate: filters.fromDate!,
            toDate: filters.toDate!,
        };
    }
}