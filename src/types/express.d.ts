import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

export interface UserPayload {
    id: Types.ObjectId;
    name: string;
    email: string;
    role: string;
    restaurant: Types.ObjectId;
}

export interface QRCodePayload {
    tableId: Types.ObjectId;
    waiterName: string;
    restaurant: Types.ObjectId;
    waiterId: Types.ObjectId;
}

declare global {
    namespace Express {
        interface Request {
            seatData?: { token: string };
            mesaData?: QRCodePayload;
            user?: UserPayload;
        }
    }
}