import { model, Schema } from "mongoose";
import { UserValidationDB } from "../../../types/account-verification.types.js";
import { date, required } from "joi";

const userValidationSchema = new Schema<UserValidationDB>({
    token: { type: String, required: true },
    user: {  type: Schema.Types.ObjectId, required: true, ref: 'user'},
    type: { type: String, enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'], required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 },
    used: { type: Boolean, default: false},
    expiresAt: {type: Date, required: true}
}, {
    timestamps: true
});

export const userValidationModel = model <UserValidationDB> ("userValidation", userValidationSchema);