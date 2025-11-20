export interface MenuFiltersDto {
    category?: string;
    search?: string;
    available?: boolean;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
}

export class MenuFiltersMapper {
    public static mapFromQuery(query: any): MenuFiltersDto {
        const filters: MenuFiltersDto = {};

        // Mapeo de campos string
        if (query.category) filters.category = query.category as string;
        if (query.search) filters.search = query.search as string;

        // Mapeo de campos booleanos (convirtiendo el string 'true'/'false' a booleano)
        if (query.available !== undefined) filters.available = query.available === 'true';
        if (query.isVegetarian !== undefined) filters.isVegetarian = query.isVegetarian === 'true';
        if (query.isVegan !== undefined) filters.isVegan = query.isVegan === 'true';
        if (query.isGlutenFree !== undefined) filters.isGlutenFree = query.isGlutenFree === 'true';

        return filters;
    }
}