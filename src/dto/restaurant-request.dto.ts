import { Types } from "mongoose";

export interface RestaurantRequestDto {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    shopType: string;
    city:string;
    restaurantName: string;
    phone: string;
    estimatedTables: number;
    termsAccepted: boolean;
}
