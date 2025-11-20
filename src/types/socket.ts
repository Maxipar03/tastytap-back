interface JoinRestaurantPayload {
    restaurant: string;
    role: 'waiter' | 'manager' | 'chef' | 'user';
}

interface JoinWaiterPayload {
    waiterId: string;
}

interface JoinTablePayload {
    restaurant: string;
    role: string
    tableId: string;
}

interface JoinOrderPayload {
    orderId: string;
}

export interface ClientToServerEvents {
    'join-restaurant': (payload: JoinRestaurantPayload) => void;
    'join-waiter': (payload: JoinWaiterPayload) => void;
    'join-order': (payload: JoinOrderPayload) => void;
}

export interface SocketData {
    restaurant?: string;
    role?: string;
    waiterId?: string;
    tableId?: string;
}