import { model, Schema } from "mongoose";
import { RestaurantRequestDB } from "../../../types/restaurant-request";

const RestaurantRequestSchema = new Schema<RestaurantRequestDB>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    address: {
        type: String,
        required: true
    },
    restaurantName: {
        type: String,
        required: true,
        unique: true
    },
    shopType: {
        type: String,
        required: true,
        unique: true
    },
    city: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    estimatedTables: {
        type: Number,
        required: true
    },
    statusRequest: {
        type: String,
        default: "PENDING"
    },
    termsAccepted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const RestaurantRequestModel = model <RestaurantRequestDB> ("restaurant_request", RestaurantRequestSchema);
