import { model, Schema } from "mongoose";
import { OnboardingDB } from "../../../types/onboarding.types";

const OnboardingSchema = new Schema<OnboardingDB>({
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
    city: {
        type: String,
        required: true
    },
    phone: {
        type: String,
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

export const OnboardingModel = model <OnboardingDB> ("onboarding", OnboardingSchema);
