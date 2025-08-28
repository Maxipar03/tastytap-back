export interface MenuFiltersDto {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    available?: boolean;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
}