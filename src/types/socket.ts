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

export interface ServerToClientEvents {
    'order:created': (data: { order: any; kdsStatus: string; timestamp: Date }) => void;
    'order:update': (data: { order: any; kdsStatus: string; newStatus?: string; timestamp: Date }) => void;
    'item:update': (data: { orderId: string; itemId: string; order: any; kdsStatus: string; newStatus: string; type: string }) => void;
    'item:add': (data: { order: any; kdsStatus: string; timestamp: Date }) => void;
    'paymethod:selected': (data: { orderId: string; paymentMethod: string }) => void;
    'QR-Used': (data: boolean) => void;
    'mesa-actualizada': (data: any) => void;
}

export interface SocketData {
    restaurant?: string;
    role?: string;
    waiterId?: string;
    tableId?: string;
}