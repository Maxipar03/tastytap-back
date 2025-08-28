
import { model, Schema } from "mongoose";
import { SeatDB } from "../../../types/seat.js";

const seatSchema = new Schema<SeatDB>({
    tableId: {
        type: Schema.Types.ObjectId,
        ref: 'table'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        default: null,
    },
    guestName: {
        type: String,
        default: null
    },
    sessionToken: {
        type: String,
        default: null
    },
    closedAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
},
    {
        timestamps: true
    })

export const SeatModel = model<SeatDB>("seat", seatSchema);