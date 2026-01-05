import { model, Schema } from "mongoose"
import { RestaurantDB } from "../../../types/restaurant.js";

const restaurantSchema = new Schema<RestaurantDB>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (email: string) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Email inválido'
        }
    },
    description: {
        type: String,
        default: "",
        trim: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    menu: [{
        type: Schema.Types.ObjectId,
        ref: "food"
    }],
    numberTables: {
        type: Number,
        default: 0
    },
    logo: {
        type: String,
        trim: true
    },
    stripeAccountId: {
        type: String,
        trim: true
    },
}, {
    timestamps: true
})

export const RestaurantModel = model<RestaurantDB>("restaurant", restaurantSchema);