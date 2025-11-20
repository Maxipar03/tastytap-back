import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

export interface UserPayload {
    [x: string]: ObjectId;
    id: Types.ObjectId;
    name: string;
    email: string;
    role: string;
    restaurant: Types.ObjectId;
    profileImage?: string;
}

export interface RestaurantInfo {
    id: Types.ObjectId;
    name: string;
    logo?: string;
}

export interface QRTablePayload {
    tableId: Types.ObjectId;
    waiterName: string;
    restaurant: RestaurantInfo;
    waiterId: Types.ObjectId;
    toGo: false;
}

export interface QRToGoPayload {
    restaurant: RestaurantInfo;
    toGo: true;
}

export interface QRResponse {
    qrImage: string;
    link: string;
    token: string;
}

export interface AccessServices {
    generateAccessQR: (payload: QRToGoPayload | QRTablePayload , type: 'table' | 'takeaway', expiresIn: Expiry = "3h") => Promise<QRResponse>;
    handleTableAccess: (payload: QRTablePayload) => Promise<QRTablePayload>;
    handleToGoAccess: (restaurantId: string | Types.ObjectId) => Promise<void>;
    verifyQrToken: (token: string) => Promise<QRTablePayload>;
}

declare global {
    namespace Express {
        interface Request {
            tableData?: QRTablePayload;
            toGoData?: QRToGoPayload;
            user?: UserPayload;
            orderId?: string;
            file?: Multer.File;
        }
        
        namespace Multer {
            interface File {
                fieldname: string;
                originalname: string;
                encoding: string;
                mimetype: string;
                size: number;
                destination: string;
                filename: string;
                path: string;
                buffer: Buffer;
            }
        }
    }
}