import { model, Schema } from "mongoose";
import { InvitationDB } from "../../../types/invitation.types.js";

const InvitationSchema = new Schema<InvitationDB>({
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

export const InvitationModel = model <InvitationDB> ("invitation", InvitationSchema);
