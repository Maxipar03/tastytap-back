export interface OrderFiltersDto {
    status?: string;
    fromDate?: string;
    toDate?: string;
    waiter?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export class OrderFiltersMapper {
    public static mapFromQuery(query: any, currentWaiterId: string): OrderFiltersDto & { currentWaiterId: string } {
        const filters: OrderFiltersDto = {};

        // Mapeo de campos string
        if (query.status && query.status !== 'undefined' && query.status !== '') {
            filters.status = query.status as string;
        }
        if (query.search && query.search !== 'undefined' && query.search !== '') {
            filters.search = query.search as string;
        }
        if (query.fromDate && query.fromDate !== 'undefined' && query.fromDate !== '' && query.fromDate !== 'null') {
            filters.fromDate = query.fromDate as string;
        }
        if (query.toDate && query.toDate !== 'undefined' && query.toDate !== '' && query.toDate !== 'null') {
            filters.toDate = query.toDate as string;
        }

        // Mapeo del filtro de waiter
        const validWaiterValues = ["me", "others", "all"];
        const waiterFilter = validWaiterValues.includes(query.waiter as string)
            ? (query.waiter as string)
            : "all";

        if (waiterFilter !== "all") {
            filters.waiter = waiterFilter === "me" ? currentWaiterId : "others";
        }

        // Mapeo de parámetros de paginación
        if (query.page && !isNaN(Number(query.page))) {
            filters.page = Number(query.page);
        }
        if (query.limit && !isNaN(Number(query.limit))) {
            filters.limit = Number(query.limit);
        }

        return {
            ...filters,
            currentWaiterId
        };
    }
}