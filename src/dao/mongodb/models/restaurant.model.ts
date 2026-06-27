import { model, Schema } from "mongoose"
import { RestaurantDB } from "../../../types/restaurant.types.js";

const openingHoursSchema = new Schema({
    day: {
        type: String,
        enum: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        required: true
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    periods: [
        {
            open: { type: String, required: true },
            close: { type: String, required: true }
        }
    ]
}, { _id: false })

const restaurantSchema = new Schema<RestaurantDB>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitud, latitud]
            required: true
        }
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    type:{
        type: String,
        required: true,
        trim: true
    },
    status:{
        type: String,
        enum: ["PENDING", "ACTIVE", "INACTIVE"],
        default: "PENDING"
    },
    openingHours: [openingHoursSchema],
    phone: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        default: "",
        trim: true
    },
    stripeStatus: {
        type: String,
        enum: ["PENDING", "ACTIVE", "INACTIVE"],
        default: "PENDING"
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
    logo: {
        type: String,
        trim: true
    },
    coverImage: {
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

restaurantSchema.index({ location: "2dsphere" });

export const RestaurantModel = model<RestaurantDB>("restaurant", restaurantSchema);