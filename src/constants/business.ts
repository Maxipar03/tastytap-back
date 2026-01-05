export const TAX_RATE = 0.08;

export const CACHE_TTL = {
    ORDER: 60,              // 1 minuto
    ACTIVE_ORDERS: 30,      // 30 segundos
    TABLE_SESSION: 60,      // 1 minuto
    ACTIVE_SESSIONS: 30,    // 30 segundos
    RESTAURANT: 600,        // 10 minutos
    MENU: 300,              // 5 minutos
} as const;

export const CACHE_KEYS = {
    order: (id: string) => `order:${id}`,
    activeOrders: (restaurantId: string) => `orders:active:${restaurantId}`,
    tableSession: (tableId: string) => `session:table:${tableId}`,
    activeSessions: (restaurantId: string) => `sessions:active:${restaurantId}`,
    restaurant: (id: string) => `restaurant:${id}`,
    restaurants: () => 'restaurants:all',
} as const;
