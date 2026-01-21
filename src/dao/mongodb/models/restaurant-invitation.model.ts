import { model, Schema } from "mongoose";
import { RestaurantInvitationDB } from "../../../types/restaurant-invitation.js";

const RestaurantInvitationSchema = new Schema<RestaurantInvitationDB>({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true
    },
    scope: {
        type: String,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "restaurant"
    }
}, {
    timestamps: true
});

export const RestaurantInvitationModel = model<RestaurantInvitationDB>("restaurant_invitation", RestaurantInvitationSchema);
