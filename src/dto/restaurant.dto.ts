import { Types } from "mongoose";

export interface CreateRestaurantDto {
    name: string;
    address: string;
    description: string;
    phone: string;
    type: string;
    ownerId: Types.ObjectId;
    location: {
        type: "Point";
        coordinates: [number, number];
    };
}