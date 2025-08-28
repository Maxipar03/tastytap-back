import { model, Schema } from "mongoose";
import { TableDB } from "../../../types/table.js"; // Asegúrate de que la ruta sea correcta

const tableSchema = new Schema<TableDB>({
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: 'restaurant'
    },
    tableNumber: {
        type: Number,
    },
    state: {
        type: String,
        enum: ["available", "occupied", "reserved"],
        default: "available"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    waiterServing: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        default: null
    }
}, {
    timestamps: true
});

export const TableModel = model<TableDB>("table", tableSchema);