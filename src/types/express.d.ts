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

export interface QRCodePayload {
    tableId: Types.ObjectId;
    waiterName: string;
    restaurant: Types.ObjectId;
    waiterId: Types.ObjectId;
}

declare global {
    namespace Express {
        interface Request {
            mesaData?: QRCodePayload;
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