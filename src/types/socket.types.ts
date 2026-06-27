interface JoinRestaurantPayload {
    restaurant: string;
    role: 'waiter' | 'manager' | 'chef' | 'user' | 'owner' | 'admin';
}

interface JoinGuestPayload {
    guestId: string;
}

export interface ClientToServerEvents {
    'join-restaurant': (payload: JoinRestaurantPayload) => void;
    'join-guest': (payload: JoinGuestPayload) => void;
}

export interface ServerToClientEvents {
    'order:created': (data: { order: any; timestamp: Date }) => void;
    'order:updated': (data: { order: any; newStatus?: string; timestamp: Date }) => void;
    'item:update': (data: { orderId: string; itemId: string; order: any; newStatus: string; type: string }) => void;
}

export interface SocketData {
    restaurant?: string;
    role?: string;
}