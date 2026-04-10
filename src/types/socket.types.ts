interface JoinRestaurantPayload {
    restaurant: string;
    role: 'waiter' | 'manager' | 'chef' | 'user' | 'owner' | 'admin';
}

interface JoinWaiterPayload {
    waiterId: string;
}

interface JoinGuestPayload {
    guestId: string;
}

export interface ClientToServerEvents {
    'join-restaurant': (payload: JoinRestaurantPayload) => void;
    'join-waiter': (payload: JoinWaiterPayload) => void;
    'join-guest': (payload: JoinGuestPayload) => void;
}

export interface ServerToClientEvents {
    'order:created': (data: { order: any; timestamp: Date }) => void;
    'order:update': (data: { order: any; newStatus?: string; timestamp: Date }) => void;
    'item:update': (data: { orderId: string; itemId: string; order: any; newStatus: string; type: string }) => void;
}

export interface SocketData {
    restaurant?: string;
    role?: string;
    waiterId?: string;
    tableId?: string;
}