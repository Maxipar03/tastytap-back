import { model, Schema } from "mongoose"
import { TableSessionDB } from "../../../types/table-session.js";

const tableSessionSchema = new Schema<TableSessionDB>({
    restaurant: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "restaurant"
    },
    table: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "table"
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    orders: [{
        type: Schema.Types.ObjectId,
        ref: "order"
    }],
    totalAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

export const TableSessionModel = model <TableSessionDB>("tableSession", tableSessionSchema);