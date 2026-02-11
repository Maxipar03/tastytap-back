import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

export interface UserPayload {
    [x: string]: ObjectId;
    id: Types.ObjectId;
    isValidateMail: boolean;
    name: string;
    email: string;
    role: string;
    restaurant: Types.ObjectId;
    profileImage?: string;
}

export interface PaginateResult<T> {
    docs: T[];
    totalDocs: number;
    limit: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    page?: number;
    totalPages: number;
    offset: number;
    prevPage?: number | null;
    nextPage?: number | null;
    pagingCounter: number;
    meta?: any;
    [customLabel: string]: T[] | number | boolean | null | undefined;
}

export interface RestaurantInfo {
    id: Types.ObjectId;
    name: string;
    logo?: string;
}

export interface WaiterInfo {
    id: Types.ObjectId;
    name: string;
}

export interface QRTablePayload {
    table: Types.ObjectId;
    restaurant: RestaurantInfo;
    waiter: WaiterInfo;
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