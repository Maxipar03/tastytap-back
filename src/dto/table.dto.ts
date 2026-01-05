import { Types } from "mongoose";
import { TableState } from "../types/table.js";

export interface CreateTableDto {
    restaurant?: Types.ObjectId;
    tableNumber?: number;
    state: TableState;
    isActive: boolean;
    waiterServing?: Types.ObjectId | null;
}