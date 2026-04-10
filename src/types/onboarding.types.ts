import { Document, Types } from "mongoose";

export interface OnboardingDB extends Document {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    address: string;
    city: string;
    email: string;
    statusRequest: "PENDING" | "APPROVED" | "REJECTED";
    restaurantName: string;
    phone: string;
    termsAccepted: boolean;
}

export interface OnboardingDao {
    create: (data: any) => Promise<OnboardingDB>;
    update: (id: string | Types.ObjectId, body: Partial<OnboardingDB>) => Promise<OnboardingDB | null>;
}

export interface OnboardingServices {
    createOnboarding: (id: Types.ObjectId, body: any) => Promise<OnboardingDB>;
    approveOnboarding: (id: string) => Promise<OnboardingDB | null>;
    rejectOnboarding: (id: string) => Promise<OnboardingDB | null>;
}